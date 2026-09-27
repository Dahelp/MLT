<?php
declare(strict_types=1);
require_once __DIR__ . '/booking.php';

$reference = substr(trim((string)($_GET['reference'] ?? '')),0,80); $sessionId=substr(trim((string)($_GET['session_id'] ?? '')),0,160);
$redirect = static function(string $result) use($reference): void { header('Location: https://mlt-lifestyle.com/account/?payment='.$result.'&reference='.rawurlencode($reference),true,303); exit; };
$settings=mlt_settings(); $secret=(string)($settings['stripe_secret_key']??'');
if (!$sessionId || !preg_match('/^MLT-[A-Z0-9-]+$/',$reference) || !str_starts_with($secret,'sk_')) $redirect('error');
$curl=curl_init('https://api.stripe.com/v1/checkout/sessions/'.rawurlencode($sessionId));
curl_setopt_array($curl,[CURLOPT_HTTPHEADER=>['Authorization: Basic '.base64_encode($secret.':')],CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>25]);
$raw=curl_exec($curl); $status=(int)curl_getinfo($curl,CURLINFO_RESPONSE_CODE); curl_close($curl); $session=is_string($raw)?json_decode($raw,true):null;
if ($status<200 || $status>=300 || !is_array($session) || ($session['payment_status']??'') !== 'paid' || ($session['client_reference_id']??'') !== $reference) $redirect('error');
$db=mlt_db($settings); if ($db) { $order=mlt_mark_stripe_order_paid($db,$reference,$sessionId,(string)($session['payment_intent']??$sessionId),(int)($session['amount_total']??0),(string)($session['currency']??'eur')); if($order)mlt_notify_paid($order,$settings); }
$redirect('success');
