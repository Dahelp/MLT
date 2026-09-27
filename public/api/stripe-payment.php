<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, max-age=0');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['error' => 'Method not allowed']); exit; }
$settingsPath = dirname(__DIR__) . '/paypal-config.php';
$settings = is_file($settingsPath) ? require $settingsPath : [];
$secret = is_array($settings) ? (string)($settings['stripe_secret_key'] ?? '') : '';
if (!str_starts_with($secret, 'sk_test_') && !str_starts_with($secret, 'sk_live_')) { http_response_code(503); echo json_encode(['error' => 'Stripe is not configured yet.']); exit; }
$body = json_decode(file_get_contents('php://input'), true); if (!is_array($body)) $body = [];
$prices = ['freedom'=>[7=>1490,10=>1990,14=>2590,21=>3690,30=>4990], 'signature'=>[7=>2490,10=>4290,14=>5890], 'concierge'=>[7=>4990,10=>6590,14=>8990], 'private'=>[7=>19900,10=>28429,14=>39800,21=>59700,30=>85286]];
$tailored = [7=>2990,10=>4290,14=>5890];
$collection = strtolower(substr(trim((string)($body['collection'] ?? '')), 0, 30)); $days = (int)($body['days'] ?? 0); $reference = substr(trim((string)($body['reference'] ?? '')), 0, 80);
$amount = !empty($body['signatureTailored']) && $collection === 'signature' ? ($tailored[$days] ?? 0) : ($prices[$collection][$days] ?? 0);
if (!$amount || !preg_match('/^MLT-[A-Z0-9-]+$/', $reference)) { http_response_code(400); echo json_encode(['error'=>'This journey cannot be paid online yet. Please contact MLT Concierge.']); exit; }
$origin = 'https://mlt-lifestyle.com';
$fields = ['mode'=>'payment','client_reference_id'=>$reference,'success_url'=>$origin.'/api/stripe-capture.php?reference='.rawurlencode($reference).'&session_id={CHECKOUT_SESSION_ID}','cancel_url'=>$origin.'/account/?payment=cancelled&reference='.rawurlencode($reference),'payment_method_types[0]'=>'card','metadata[reference]'=>$reference,'metadata[collection]'=>$collection,'line_items[0][price_data][currency]'=>'eur','line_items[0][price_data][unit_amount]'=>(string)($amount * 100),'line_items[0][price_data][product_data][name]'=>'MLT '.ucfirst($collection).' Collection · '.$days.' days','line_items[0][quantity]'=>'1'];
$curl = curl_init('https://api.stripe.com/v1/checkout/sessions');
curl_setopt_array($curl,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>http_build_query($fields),CURLOPT_HTTPHEADER=>['Authorization: Basic '.base64_encode($secret.':'),'Content-Type: application/x-www-form-urlencoded'],CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>25]);
$raw = curl_exec($curl); $status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE); curl_close($curl); $result=is_string($raw)?json_decode($raw,true):null;
if ($status < 200 || $status >= 300 || !is_array($result) || empty($result['url'])) { error_log('Stripe session failed: '.(is_array($result)?($result['error']['message']??'unknown'):'unknown')); http_response_code(502); echo json_encode(['error'=>'Unable to start Stripe checkout.']); exit; }
echo json_encode(['url'=>$result['url']]);
