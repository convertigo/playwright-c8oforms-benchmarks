FROM mcr.microsoft.com/playwright:v1.58.2-noble

USER root

WORKDIR /opt/app-root/src

COPY package.json package-lock.json ./

RUN npm ci

COPY playwright.config.ts README.md ./
COPY tests ./tests
COPY docker/run-playwright.sh /usr/local/bin/run-playwright.sh

RUN chmod 0755 /usr/local/bin/run-playwright.sh \
  && mkdir -p /opt/app-root/src \
  && chgrp -R 0 /opt/app-root/src \
  && chmod -R g=u /opt/app-root/src

ENV CI=true \
    PLAYWRIGHT_HTML_OPEN=never \
    PLAYWRIGHT_HTML_OUTPUT_DIR=/tmp/playwright-report \
    PLAYWRIGHT_ARTIFACTS_DIR=/tmp/playwright-results

USER pwuser

ENTRYPOINT ["/usr/local/bin/run-playwright.sh"]
CMD []
