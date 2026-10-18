<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');
require_once __DIR__ . '/booking.php';
require_once __DIR__ . '/journey-pricing.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }
$settingsPath = dirname(__DIR__) . '/paypal-config.php';
$settings = is_file($settingsPath) ? require $settingsPath : [];
$secret = is_array($settings) ? (string)($settings['stripe_secret_key'] ?? '') : '';
if (!preg_match('/^(?:sk|rk)_(?:test|live)_/', $secret)) { http_response_code(503); echo json_encode(['error' => 'Stripe is not configured yet.']); exit; }
$body = json_decode(file_get_contents('php://input'), true); if (!is_array($body)) $body = [];
$prices = mlt_journey_rate_tables(true);
$tailored = mlt_journey_pricing()['signatureTailored'];
$collection = strtolower(substr(trim((string)($body['collection'] ?? '')), 0, 30)); $days = (int)($body['days'] ?? 0); $reference = substr(trim((string)($body['reference'] ?? '')), 0, 80);
$amount = !empty($body['signatureTailored']) && $collection === 'signature' ? ($tailored[$days] ?? 0) : ($prices[$collection][$days] ?? 0);
if (!$amount || !preg_match('/^MLT-[A-Z0-9-]+$/', $reference)) { http_response_code(400); echo json_encode(['error'=>'This journey cannot be paid online yet. Please contact MLT Concierge.']); exit; }
if (empty($body['consent'])) { http_response_code(400); echo json_encode(['error'=>'Please accept the booking and privacy terms.']); exit; }
$kind=in_array($body['paymentKind']??'', ['deposit','full','balance'],true)?$body['paymentKind']:'full';$db=mlt_db($settings);$quote=$db?mlt_payment_quote($db,$reference,(float)$amount,$kind):null;if(!$quote){http_response_code(400);echo json_encode(['error'=>'This application has already been paid.']);exit;}$amount=(float)$quote['amount'];$kind=$quote['kind'];
require_once __DIR__.'/voucher-core.php';
try {mlt_voucher_authorize_journey($db,$reference); $existingUrl=mlt_voucher_hold_checkout($db,$reference,'stripe',(float)$quote['paid']);if($existingUrl){echo json_encode(['url'=>$existingUrl]);exit;} }
catch(Throwable $e){http_response_code(409);echo json_encode(['error'=>$e instanceof DomainException?$e->getMessage():'Unable to reserve this payment. Please retry.']);exit;}
$origin = 'https://mlt-lifestyle.com';
$fields = ['expires_at'=>(string)(time()+1860),'mode'=>'payment','client_reference_id'=>$reference,'success_url'=>$origin.'/api/stripe-capture.php?reference='.rawurlencode($reference).'&kind='.rawurlencode($kind).'&session_id={CHECKOUT_SESSION_ID}','cancel_url'=>$origin.'/account/?payment=cancelled&reference='.rawurlencode($reference),'payment_method_types[0]'=>'card','metadata[reference]'=>$reference,'metadata[payment_kind]'=>$kind,'metadata[collection]'=>$collection,'line_items[0][price_data][currency]'=>'eur','line_items[0][price_data][unit_amount]'=>(string)round($amount * 100),'line_items[0][price_data][product_data][name]'=>'MLT '.ucfirst($collection).' Collection · '.$days.' days','line_items[0][quantity]'=>'1'];
$curl = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query($fields),CURLOPT_HTTPHEADER=>['Authorization: Basic '.base64_encode($secret.':'),'Content-Type: application/x-www-form-urlencoded'],CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>25]);
$raw = curl_exec($curl); $status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE); curl_close($curl); $result=is_string($raw)?json_decode($raw,true):null;
if ($status < 200 || $status >= 300 || !is_array($result) || empty($result['url'])) { if(in_array($status,[400,401,403,404,422],true))$db->prepare('DELETE h FROM mlt_journey_checkout_holds h JOIN mlt_orders o ON o.id=h.order_id WHERE o.reference_code=? AND h.checkout_id IS NULL')->execute([$reference]); error_log('Stripe session failed: '.(is_array($result)?($result['error']['message']??'unknown'):'unknown')); http_response_code(502); echo json_encode(['error'=>'Unable to start Stripe checkout.']); exit; }
mlt_voucher_save_journey_checkout($db,$reference,$result['url'],$result['id']);
echo json_encode(['url'=>$result['url']]);
