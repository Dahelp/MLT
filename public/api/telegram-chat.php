<?php
declare(strict_types=1);
require_once __DIR__ . '/telegram-routing.php';

function mlt_chat_notification_topic(string $department, string $requested = ''): string {
    $topic = $requested !== '' ? $requested : $department;
    if (($department === 'sales' && in_array($topic, ['sales','investments'], true)) || ($department === 'concierge' && $topic === 'concierge')) return $topic;
    throw new InvalidArgumentException('Invalid chat topic.');
}

function mlt_notify_chat_message(array $settings, array $conversation, string $message, int $messageId, bool $newConversation = false): bool {
    // A failed notification must never undo an already saved client message.
    try {
        $token = (string)($settings['telegram_bot_token'] ?? (getenv('TELEGRAM_BOT_TOKEN') ?: ''));
        if ($token === '') return false;
        $topic = mlt_chat_notification_topic((string)$conversation['department'], (string)($conversation['notification_topic'] ?? ''));
        $source = $topic === 'sales' ? 'acquisitions' : $topic;
        $chatId = mlt_inquiry_telegram_chat($settings, $source);
        if ($chatId === '') return false;
        $id = (int)$conversation['id'];
        $url = 'https://mlt-lifestyle.com/' . ($conversation['department'] === 'sales' ? 'sales' : 'concierge') . '/chat/?conversation=' . $id;
        $label = ['sales'=>'Продажи','investments'=>'Инвестиции','concierge'=>'Туры / консьерж'][$topic];
        $preview = mb_substr($message, 0, 1200);
        if (mb_strlen($message) > 1200) $preview .= '…';
        $text = implode("\n", [
            '◆ ' . ($newConversation ? 'НОВЫЙ ДИАЛОГ ОНЛАЙН-ЧАТА' : 'НОВОЕ СООБЩЕНИЕ В ОНЛАЙН-ЧАТЕ'),
            'Отдел: ' . $label, 'Диалог: #' . $id . ' · сообщение #' . $messageId,
            'Клиент: ' . mb_substr((string)$conversation['name'], 0, 120),
            'Email: ' . mb_substr((string)$conversation['email'], 0, 160),
            '', 'Сообщение клиента:', $preview, '', 'Открыть переписку: ' . $url,
        ]);
        $payload = json_encode(['chat_id'=>$chatId,'text'=>$text,'disable_web_page_preview'=>true,
            'reply_markup'=>['inline_keyboard'=>[[['text'=>'Открыть переписку в кабинете','url'=>$url]]]]], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
        $context = stream_context_create(['http'=>['method'=>'POST','header'=>"Content-Type: application/json\r\n",'content'=>$payload,'timeout'=>3,'ignore_errors'=>true]]);
        $response = @file_get_contents('https://api.telegram.org/bot' . $token . '/sendMessage', false, $context);
        $result = $response !== false ? json_decode($response, true) : null;
        if (is_array($result) && !empty($result['ok'])) return true;
        error_log('MLT chat Telegram notification failed for message ' . $messageId);
    } catch (Throwable $error) {
        // Do not log the URL, token or customer content from transport exceptions.
        error_log('MLT chat Telegram notification failed for message ' . $messageId);
    }
    return false;
}
