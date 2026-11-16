import ftplib
import hmac
import os
import ssl
import sys
from pathlib import Path

files = {
    '/api/telegram-routing.php': Path('public/api/telegram-routing.php'),
    '/api/telegram-sales-destination.php': Path('static-export/api/telegram-sales-destination.php'),
    '/api/telegram-sales-message.php': Path('public/api/telegram-sales-message.php'),
    '/api/telegram-inquiry-message.php': Path('public/api/telegram-inquiry-message.php'),
    '/api/telegram-chat.php': Path('public/api/telegram-chat.php'),
    '/api/telegram-department-destinations.php': Path('static-export/api/telegram-department-destinations.php'),
}
if '--include-handler' in sys.argv:
    files['/api/concierge.php'] = Path('public/api/concierge.php')
    files['/api/chat.php'] = Path('public/api/chat.php')
with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=45) as ftp:
    ftp.connect(os.environ['FTP_SERVER'])
    ftp.login(os.environ['FTP_USERNAME'], os.environ['FTP_PASSWORD'])
    ftp.prot_p()
    for remote, local in files.items():
        blocks = []
        ftp.retrbinary('RETR ' + remote, blocks.append)
        if not hmac.compare_digest(b''.join(blocks), local.read_bytes()):
            raise RuntimeError('Telegram routing deployment does not match the prepared files')
print('Production Telegram sales destination and routing verified')
