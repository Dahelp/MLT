import ftplib
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('publish_assets', ROOT / 'scripts/publish-assets.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FakeFTP:
    def __init__(self, fail=False):
        self.files = {'older.js': b'previous release', 'current.js': b'good'}
        self.fail = fail
        self.deleted = []

    def size(self, name):
        if name not in self.files:
            raise ftplib.error_perm('550 Missing')
        return len(self.files[name])

    def storbinary(self, command, source):
        name = command.removeprefix('STOR ')
        self.files[name] = source.read()
        if self.fail:
            raise ConnectionError('Interrupted upload')

    def rename(self, source, target):
        self.files[target] = self.files.pop(source)

    def delete(self, name):
        self.deleted.append(name)
        self.files.pop(name, None)


class PublishTests(unittest.TestCase):
    def test_retains_old_bundles_and_skips_existing_content(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, 'current.js').write_bytes(b'good')
            Path(directory, 'new.js').write_bytes(b'new bundle')
            ftp = FakeFTP()
            self.assertEqual(module.publish(ftp, directory), (1, 1))
            self.assertEqual(ftp.files, {'older.js': b'previous release', 'current.js': b'good', 'new.js': b'new bundle'})
            self.assertEqual(ftp.deleted, [])

    def test_interrupted_upload_preserves_existing_target(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, 'current.js').write_bytes(b'repaired bundle')
            ftp = FakeFTP(fail=True)
            with self.assertRaises(ConnectionError):
                module.publish(ftp, directory)
            self.assertEqual(ftp.files, {'older.js': b'previous release', 'current.js': b'good'})
            self.assertTrue(all(name.startswith('.upload-') for name in ftp.deleted))

    def test_replaces_incomplete_bundle_after_upload(self):
        with tempfile.TemporaryDirectory() as directory:
            Path(directory, 'current.js').write_bytes(b'repaired bundle')
            ftp = FakeFTP()
            self.assertEqual(module.publish(ftp, directory), (1, 0))
            self.assertEqual(ftp.files['current.js'], b'repaired bundle')
            self.assertIn('older.js', ftp.files)

    def test_workflow_publishes_assets_before_pages_and_excludes_deletion(self):
        workflow = (ROOT / '.github/workflows/deploy-ftp.yml').read_text()
        self.assertLess(workflow.index('run: python3 scripts/publish-assets.py'), workflow.index('- name: Deploy by FTP'))
        final = workflow.split('- name: Deploy by FTP')[1]
        self.assertIn('            assets\n', final)
        self.assertIn('            assets/**', final)


if __name__ == '__main__':
    unittest.main()
