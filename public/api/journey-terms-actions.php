<?php
declare(strict_types=1);

// Included only after the calling account API has authenticated its actor.
if (in_array($action, ['journey_settings','journey_settings_save','journey_terms_update','journey_protection','journey_cancellation_preview'], true)) {
    try {
        $actor = $operator ?? $user ?? [];
        $admin = ($actor['role'] ?? '') === 'admin';
        if ($action !== 'journey_protection' && !$admin) { http_response_code(403); echo json_encode(['error'=>'Administrator access required.']); exit; }
        if ($action === 'journey_settings') { echo json_encode(['ok'=>true,'settings'=>mlt_protection_settings($db)]); exit; }
        if ($action === 'journey_settings_save') {
            $percent = (float)($body['percent'] ?? 0);
            $terms = mb_substr(trim((string)($body['terms'] ?? '')),0,6000);
            $enabled = !empty($body['enabled']);
            if ((!is_finite($percent) || $percent<5 || $percent>8) || ($enabled && !$terms)) throw new DomainException('Choose a rate between 5% and 8% and enter the approved protection terms before enabling.');
            mlt_protection_settings($db);
            $settings = ['percent'=>$percent,'terms'=>$terms,'enabled'=>$enabled];
            $db->prepare('INSERT INTO mlt_journey_settings (id,settings_json) VALUES (1,?) ON DUPLICATE KEY UPDATE settings_json=VALUES(settings_json)')->execute([json_encode($settings,JSON_THROW_ON_ERROR)]);
            echo json_encode(['ok'=>true,'settings'=>$settings]); exit;
        }
        $reference = (string)($body['reference'] ?? '');
        require_once __DIR__.'/voucher-core.php'; mlt_voucher_schema($db);
        $db->beginTransaction();
        $q=$db->prepare('SELECT * FROM mlt_orders WHERE reference_code=? AND archived_at IS NULL FOR UPDATE');$q->execute([$reference]);$order=$q->fetch();
        if (!$order || (!$admin && (int)$order['user_id'] !== (int)$actor['id'])) throw new DomainException('Journey not found.');
        if (in_array($order['status'],['cancelled','completed'],true)) throw new DomainException('Journey is closed.');
        // Editing a quote is forbidden while a provider checkout can still collect the old amount.
        $q=$db->prepare('SELECT 1 FROM mlt_journey_checkout_holds WHERE order_id=?');$q->execute([$order['id']]);
        if ($q->fetchColumn()) throw new DomainException('Close the existing checkout before changing the quote.');
        $terms=mlt_order_terms($order);
        if (!$terms) throw new DomainException('This order uses an earlier quote. Please contact MLT.');
        if ($action === 'journey_cancellation_preview') {
            $date=(string)($body['cancellationDate']??gmdate('Y-m-d'));
            $arrival=DateTimeImmutable::createFromFormat('!Y-m-d',(string)$order['arrival_date'],new DateTimeZone('UTC'));
            $cancel=DateTimeImmutable::createFromFormat('!Y-m-d',$date,new DateTimeZone('UTC'));
            if(!$arrival||!$cancel||$cancel->format('Y-m-d')!==$date)throw new DomainException('Enter valid journey and cancellation dates.');
            $costs=$body['costs']??null;
            if($costs!==null&&$costs!==''&&(!is_numeric($costs)||(float)$costs<0))throw new DomainException('Costs must be a non-negative amount.');
            $days=(int)$cancel->diff($arrival)->format('%r%a');
            $result=mlt_journey_cancellation($terms,$days,(float)$order['paid_amount'],$costs===null||$costs===''?null:(float)$costs);
            $db->rollBack();echo json_encode(['ok'=>true,'daysBefore'=>$days,'result'=>$result]);exit;
        }
        if ($action === 'journey_protection') {
            if ((float)$order['paid_amount']>0) throw new DomainException('Protection can only be chosen before the first payment.');
            $settings=mlt_protection_settings($db); $selected=!empty($body['enabled']);
            if ($selected && (empty($settings['enabled']) || empty($settings['terms']))) throw new DomainException('Protection is currently unavailable.');
            $terms['protectionPercent']=$selected?(float)$settings['percent']:0;
            $terms['protectionAmount']=round($terms['base']*$terms['protectionPercent']/100,2);
            $terms['protectionTerms']=$selected?$settings['terms']:'';
        } else {
            if ($terms['variant']==='signature_tailored') {
                $fee=$body['planningFee']??null;
                if(!is_numeric($fee)||$fee<500||$fee>1500)throw new DomainException('Planning Fee must be between EUR 500 and 1,500.');
                if((float)$order['paid_amount']>0 && abs((float)$fee-$terms['planningFee'])>.009)throw new DomainException('Planning Fee cannot change after payment.');
                $terms['planningFee']=round((float)$fee,2);
                $terms['routeApproved']=!empty($body['routeApproved']);
            }
            if($terms['variant']==='private')$terms['contractSigned']=!empty($body['contractSigned']);
        }
        $terms['total']=round($terms['tourTotal']+$terms['planningFee']+$terms['protectionAmount']+(float)($order['extras_amount']??0),2);
        $db->prepare('UPDATE mlt_orders SET journey_terms_json=?,total_amount=? WHERE id=?')->execute([json_encode($terms,JSON_THROW_ON_ERROR),$terms['total'],$order['id']]);
        $db->commit(); echo json_encode(['ok'=>true,'terms'=>$terms]); exit;
    } catch (DomainException $e) { if($db->inTransaction())$db->rollBack();http_response_code(409);echo json_encode(['error'=>$e->getMessage()]);exit; }
    catch(Throwable $e){if($db->inTransaction())$db->rollBack();error_log('Journey terms: '.$e->getMessage());http_response_code(503);echo json_encode(['error'=>'Could not save journey terms.']);exit;}
}
