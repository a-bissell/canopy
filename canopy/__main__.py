"""Entry point: python -m canopy"""

import logging
import uvicorn

from .config import settings


def main():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    uvicorn.run(
        "canopy.app:create_app",
        factory=True,
        host=settings.host,
        port=settings.api_port,
        log_level="info",
    )


if __name__ == "__main__":
    main()
