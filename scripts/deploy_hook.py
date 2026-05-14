#!/usr/bin/env python3
"""Local HTTP hook: POST with Authorization: Bearer <token> runs deploy.sh."""

from __future__ import annotations

import json
import os
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer


def _fail(handler: BaseHTTPRequestHandler, code: int, msg: str) -> None:
    body = json.dumps({"ok": False, "error": msg}).encode()
    handler.send_response(code)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class Handler(BaseHTTPRequestHandler):
    server_version = "DisregardfiatDeployHook/1.0"

    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - - [%s] %s\n" % (self.client_address[0], self.log_date_time_string(), fmt % args))

    def do_POST(self) -> None:  # noqa: N802
        token = os.environ.get("DEPLOY_HOOK_TOKEN", "").strip()
        if not token:
            _fail(self, 500, "DEPLOY_HOOK_TOKEN is not set")
            return

        auth = self.headers.get("Authorization", "")
        if auth != f"Bearer {token}":
            _fail(self, 401, "unauthorized")
            return

        if self.path.rstrip("/") != "/_deploy/hook":
            _fail(self, 404, "not found")
            return

        repo = os.environ.get("REPO_DIR", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        script = os.path.join(repo, "scripts", "deploy.sh")
        try:
            subprocess.run(["/usr/bin/bash", script], check=True, cwd=repo, env=os.environ.copy())
        except subprocess.CalledProcessError as e:
            _fail(self, 500, f"deploy failed (exit {e.returncode})")
            return

        body = json.dumps({"ok": True}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802
        _fail(self, 405, "method not allowed")


def main() -> None:
    host = os.environ.get("DEPLOY_HOOK_BIND", "127.0.0.1")
    port = int(os.environ.get("DEPLOY_HOOK_PORT", "19877"))
    httpd = HTTPServer((host, port), Handler)
    sys.stderr.write(f"deploy hook listening on http://{host}:{port}\n")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
