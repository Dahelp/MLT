<?php
declare(strict_types=1);
/** Queue authorization is derived from the authenticated role, never a browser role. */
function mlt_chat_scope(string $role, string $requested = ''): ?string {
    if ($role === 'admin') {
        if ($requested === '' || $requested === 'all') return null;
        if (in_array($requested, ['concierge', 'sales'], true)) return $requested;
        throw new InvalidArgumentException('Invalid chat department.');
    }
    $scope = in_array($role, ['manager', 'salesmanager'], true) ? 'sales' : ($role === 'concierge' ? 'concierge' : '');
    if ($scope === '' || ($requested !== '' && $requested !== $scope)) throw new RuntimeException('Chat department access denied.');
    return $scope;
}
