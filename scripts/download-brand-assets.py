import json
import os
import re
import subprocess
import sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "public", "brand")
JSON_PATH = os.path.join(os.path.dirname(__file__), "drive-assets.json")

PATH_MAP = {
    "الشهادات": "certificates",
    "اللوجو": "logo",
    "بروفايل دبلومه الحوكمه": "diploma",
    "ثيم السوشيال": "social",
    "جديد": "new",
    "نسخة من": "copy",
    "الغلاف": "cover",
    "الختام": "closing",
    "قبل الشهادات": "before-certificates",
    "دبلوم الحوكمه المتقدمه": "advanced-governance-diploma",
    "lagrcp ابيض": "lagrcp-white",
    "lagrcp اسود": "lagrcp-black",
}


def sanitize_path(path: str) -> str:
    out = path.replace("\\", "/")
    for ar, en in PATH_MAP.items():
        out = out.replace(ar, en)
    out = re.sub(r"[^\w\s./\-]", "", out, flags=re.UNICODE)
    out = re.sub(r"\s+", "-", out.strip())
    out = re.sub(r"-+", "-", out)
    return out.lower()


def main():
    with open(JSON_PATH, encoding="utf-8") as f:
        items = json.load(f)

    os.makedirs(ROOT, exist_ok=True)
    for item in items:
        rel = sanitize_path(item["path"])
        dest = os.path.join(ROOT, rel.replace("/", os.sep))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        print(f"Downloading {rel}...")
        subprocess.run(
            [sys.executable, "-m", "gdown", item["url"], "-O", dest],
            check=False,
            env={**os.environ, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"},
        )


if __name__ == "__main__":
    main()
