#!/usr/bin/env python3
"""把 sync_feishu_drafts.py 产出的 writings 推到 GitHub main，单次 commit。

凭据读取顺序：
1. 环境变量 DIGIWILD_GITHUB_TOKEN
2. ~/.config/digiwild-sync/github_token（权限 600）
3. macOS Keychain 条目 svc="GitHub - https://api.github.com", acct="Qiangs1023"
   读到后写入 2 的缓存文件，避免每次都依赖 security 命令。

凭据缺失时不报错，输出 SKIP 并退出 0，便于定时任务空转。
"""
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

MANIFEST = Path("/tmp/digiwild_feishu_sync_manifest.json")
INDEX = Path("/tmp/digiwild_feishu_sync_index.json")
TOKEN_FILE = Path.home() / ".config" / "digiwild-sync" / "github_token"
KEYCHAIN_SERVICE = "GitHub - https://api.github.com"
KEYCHAIN_ACCOUNT = "Qiangs1023"
API = "https://api.github.com"


def token():
    value = os.environ.get("DIGIWILD_GITHUB_TOKEN", "").strip()
    if value:
        return value
    if TOKEN_FILE.exists():
        value = TOKEN_FILE.read_text(encoding="utf-8").strip()
        if value:
            return value
    value = keychain_token()
    if value:
        cache_token(value)
    return value


def keychain_token():
    try:
        result = subprocess.run(
            f'/usr/bin/security find-generic-password -s "{KEYCHAIN_SERVICE}" '
            f'-a "{KEYCHAIN_ACCOUNT}" -w',
            shell=True, capture_output=True, text=True, timeout=20,
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    return ""


def cache_token(value):
    try:
        TOKEN_FILE.parent.mkdir(parents=True, exist_ok=True)
        TOKEN_FILE.write_text(value, encoding="utf-8")
        os.chmod(TOKEN_FILE, 0o600)
    except OSError:
        pass


def request(method, path, auth, payload=None):
    url = path if path.startswith("http") else API + path
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Accept", "application/vnd.github+json")
    req.add_header("Authorization", f"Bearer {auth}")
    req.add_header("X-GitHub-Api-Version", "2022-11-28")
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "replace")[:400]
        raise RuntimeError(f"{method} {path} -> HTTP {exc.code}: {detail}") from None


def main():
    if not MANIFEST.exists() or not INDEX.exists():
        print("ERROR: 缺少同步清单，请先运行 sync_feishu_drafts.py")
        return 2
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    if index.get("validation") != "ok":
        print("ERROR: 本地内容校验未通过，拒绝推送")
        return 2
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    owner, repo, branch = index["owner"], index["repo"], index["branch"]

    auth = token()
    if not auth:
        print("SKIP: 未找到 GitHub 写凭据，仅完成本地同步。")
        print(f"  配置方式：把 fine-grained PAT 写入 {TOKEN_FILE}（chmod 600），")
        print(f"  或设置环境变量 DIGIWILD_GITHUB_TOKEN，或在 Keychain 建条目 "
              f"svc={KEYCHAIN_SERVICE} / acct={KEYCHAIN_ACCOUNT}。")
        return 0

    remote = request("GET", f"/repos/{owner}/{repo}/contents/content/writings?ref={branch}", auth)
    remote_sha = {item["name"]: item["sha"] for item in remote} if isinstance(remote, list) else {}

    pending = []
    for item in index["files"]:
        name = Path(item["path"]).name
        if remote_sha.get(name) == item["blob_sha"]:
            continue
        content = next((f["content"] for f in manifest["all_files"]
                        if f["path"] == item["path"]), None)
        if content is None:
            print(f"ERROR: 清单缺少内容 {item['path']}")
            return 2
        pending.append({"path": item["path"], "mode": "100644", "type": "blob", "content": content})

    if not pending:
        print("unchanged: GitHub main 已是最新，无提交")
        return 0

    ref = request("GET", f"/repos/{owner}/{repo}/git/ref/heads/{branch}", auth)
    base_commit = ref["object"]["sha"]
    commit = request("GET", f"/repos/{owner}/{repo}/git/commits/{base_commit}", auth)
    base_tree = commit["tree"]["sha"]

    tree = request("POST", f"/repos/{owner}/{repo}/git/trees", auth,
                   {"base_tree": base_tree, "tree": pending})
    new_commit = request("POST", f"/repos/{owner}/{repo}/git/commits", auth, {
        "message": f"chore: sync {len(pending)} writing draft(s) from Feishu Bitable",
        "tree": tree["sha"], "parents": [base_commit],
    })
    request("PATCH", f"/repos/{owner}/{repo}/git/refs/heads/{branch}", auth,
            {"sha": new_commit["sha"]})

    print(f"pushed: {len(pending)} 个文件 → {owner}/{repo}@{branch}  commit {new_commit['sha'][:10]}")
    for item in pending:
        print(f"  {item['path']}")
    print("Cloudflare Pages 会由 main 推送触发构建")
    return 0


if __name__ == "__main__":
    sys.exit(main())
