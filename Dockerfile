FROM node:24-slim AS chrome

ENV LANG=C.UTF-8 TZ=Asia/Tokyo

RUN apt-get update \
    && apt-get update \
    && apt-get install -y chromium fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf libxss1 git \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

ARG WORKDIR

RUN mkdir -p $WORKDIR

WORKDIR $WORKDIR

FROM chrome AS crawler

ARG WORKDIR

COPY ./ $WORKDIR

RUN mkdir -p "$WORKDIR/data"

RUN git config --global --add safe.directory "$WORKDIR/data"

RUN npm --production=false install \
    && npm run build

VOLUME ["$WORKDIR/data"]

CMD ["npm", "start"]
