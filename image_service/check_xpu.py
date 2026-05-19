from __future__ import annotations

import torch


def main() -> None:
    print(f"torch={torch.__version__}")
    print(f"cuda_available={torch.cuda.is_available()}")
    has_xpu = hasattr(torch, "xpu")
    print(f"xpu_api={has_xpu}")
    if not has_xpu:
        return

    print(f"xpu_available={torch.xpu.is_available()}")
    if torch.xpu.is_available():
        print(f"xpu_device_count={torch.xpu.device_count()}")
        for index in range(torch.xpu.device_count()):
            print(f"xpu_device_{index}={torch.xpu.get_device_name(index)}")


if __name__ == "__main__":
    main()
