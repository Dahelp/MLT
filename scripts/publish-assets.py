"""Publish immutable bundles before HTML, retaining bundles used by open tabs."""
import ftplib
import os
from pathlib import Path
import ssl
import sys
import uuid


def publish(ftp, directory):
    files = sorted(Path(directory).rglob('*'))
    uploaded = skipped = 0
    for path in files:
        if not path.is_file():
            continue
        relative = path.relative_to(directory).as_posix()
        if '/' in relative:
            raise ValueError('Asset bundles must be in the flat assets directory')
        try:
            size = ftp.size(relative)
        except ftplib.error_perm as error:
            if not str(error).startswith('550'):
                raise
            size = None
        if size == path.stat().st_size:
            skipped += 1
            continue
        temporary = '.upload-' + uuid.uuid4().hex + '.part'
        try:
            with path.open('rb') as source:
                ftp.storbinary('STOR ' + temporary, source)
            ftp.rename(temporary, relative)
        except Exception:
            try:
                ftp.delete(temporary)
            except ftplib.Error:
                pass
            raise
        uploaded += 1
    return uploaded, skipped


def main():
    directory = Path(sys.argv[1]).resolve()
    if not directory.is_dir() or not any(directory.iterdir()):
        raise ValueError('Built assets directory is missing or empty')
    with ftplib.FTP_TLS(context=ssl.create_default_context(), timeout=90) as ftp:
        ftp.connect(os.environ['FTP_SERVER'])
        ftp.login(os.environ['FTP_USERNAME'], os.environ['FTP_PASSWORD'])
        ftp.prot_p()
        ftp.cwd('/')
        try:
            ftp.cwd('assets')
        except ftplib.error_perm:
            ftp.mkd('assets')
            ftp.cwd('assets')
        ftp.voidcmd('TYPE I')
        uploaded, skipped = publish(ftp, directory)
        print(f'Assets published: {uploaded}; unchanged: {skipped}; older bundles retained')


if __name__ == '__main__':
    main()
