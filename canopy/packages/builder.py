"""UPK package builder for Unitree OTA delivery.

UPK file format (reverse-engineered from ota_module_utils):

  112-byte header:
    [0-3]    magic      "UTPK"
    [4-7]    version    0x00 0x01 0x00 0x00
    [8-15]   time_sec   uint64 LE (epoch seconds)
    [16-23]  datalen    uint64 LE (size of tar data after header)
    [24-27]  flags      uint32 LE (1 = tar format)
    [28-31]  seed       uint32 LE (0 for unencrypted)
    [32-47]  sign       16 bytes raw MD5 of tar data
    [48-111] name       null-terminated module name (max 63 chars)

  Followed by a tar archive containing module.json.
"""

import hashlib
import io
import json
import struct
import tarfile
import time
from pathlib import Path

UPK_MAGIC = b"UTPK"
UPK_HEADER_SIZE = 112


def build_module_json(
    commands: list[dict],
    module_name: str = "system_patch",
    version: str = "1.0.0",
) -> str:
    cmd_list = []
    for entry in commands:
        cmd_list.append({
            "Cmd": entry["Cmd"],
            "Delay": entry.get("Delay", 0.0),
            "ExpectCode": entry.get("ExpectCode", [0]),
            "IgnoreUnexpected": entry.get("IgnoreUnexpected", True),
        })

    desc = {
        "Name": module_name,
        "Version": version,
        "Type": "NORMAL",
        "Method": "",
        "Commit": "",
        "FileList": {},
        "Install": {
            "CmdPreList": cmd_list,
            "CmdPostList": [],
        },
        "Remove": {
            "CmdPreList": [],
            "CmdPostList": [],
        },
    }
    return json.dumps(desc, indent=4)


def _build_header(tar_data: bytes, module_name: str) -> bytes:
    md5_digest = hashlib.md5(tar_data).digest()
    name_bytes = module_name.encode("utf-8")[:63]

    hdr = bytearray(UPK_HEADER_SIZE)
    hdr[0:4] = UPK_MAGIC
    hdr[4:8] = b"\x00\x01\x00\x00"
    struct.pack_into("<Q", hdr, 8, int(time.time()))
    struct.pack_into("<Q", hdr, 16, len(tar_data))
    struct.pack_into("<I", hdr, 24, 1)  # tar format flag
    struct.pack_into("<I", hdr, 28, 0)  # no encryption
    hdr[32:48] = md5_digest
    hdr[48:48 + len(name_bytes)] = name_bytes
    return bytes(hdr)


def build_package(
    commands: list[dict],
    module_name: str = "system_patch",
    version: str = "1.0.0",
    extra_files: dict[str, tuple[bytes, int]] | None = None,
) -> bytes:
    """Build a complete .upk package.

    commands: list of {"Cmd": "...", "Delay": 0.0, ...} dicts
    extra_files: dict mapping relative path -> (content_bytes, file_mode)
    """
    module_json = build_module_json(commands, module_name, version).encode()

    tar_buf = io.BytesIO()
    with tarfile.open(fileobj=tar_buf, mode="w", format=tarfile.GNU_FORMAT) as tar:
        dir_info = tarfile.TarInfo(name=module_name)
        dir_info.type = tarfile.DIRTYPE
        dir_info.mode = 0o755
        tar.addfile(dir_info)

        info = tarfile.TarInfo(name=f"{module_name}/module.json")
        info.size = len(module_json)
        info.mode = 0o644
        tar.addfile(info, io.BytesIO(module_json))

        if extra_files:
            for rel_path, (content, mode) in extra_files.items():
                finfo = tarfile.TarInfo(name=f"{module_name}/{rel_path}")
                finfo.size = len(content)
                finfo.mode = mode
                tar.addfile(finfo, io.BytesIO(content))

    tar_data = tar_buf.getvalue()
    return _build_header(tar_data, module_name) + tar_data


def build_package_to_file(
    commands: list[dict],
    output: str | Path,
    module_name: str = "system_patch",
    version: str = "1.0.0",
    extra_files: dict[str, tuple[bytes, int]] | None = None,
) -> tuple[Path, str, int]:
    """Build UPK to disk. Returns (path, md5_hex, file_size)."""
    data = build_package(commands, module_name, version, extra_files)
    path = Path(output)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    md5 = hashlib.md5(data).hexdigest()
    return path, md5, len(data)
