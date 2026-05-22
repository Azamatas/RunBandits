FROM postgres:16-alpine

ARG NPROC=

LABEL maintainer="PostGIS Project - https://postgis.net"

ENV POSTGIS_VERSION=3.5.6
ENV POSTGIS_SHA256=b002b067d2a0e10374d487e03259b44020cad11ba06a34bd9b4f02c242694a05

RUN set -eux \
    && apk add --no-cache --virtual .fetch-deps \
        ca-certificates \
        openssl \
        tar \
    \
    && wget -O postgis.tar.gz "https://github.com/postgis/postgis/archive/${POSTGIS_VERSION}.tar.gz" \
    && echo "${POSTGIS_SHA256} *postgis.tar.gz" | sha256sum -c - \
    && mkdir -p /usr/src/postgis \
    && tar \
        --extract \
        --file postgis.tar.gz \
        --directory /usr/src/postgis \
        --strip-components 1 \
    && rm postgis.tar.gz \
    \
    && apk add --no-cache --virtual .build-deps \
        gdal-dev \
        geos-dev \
        proj-dev \
        proj-util \
        sfcgal-dev \
        $DOCKER_PG_LLVM_DEPS \
        autoconf \
        automake \
        cunit-dev \
        file \
        g++ \
        gcc \
        gettext-dev \
        json-c-dev \
        libtool \
        libxml2-dev \
        make \
        pcre2-dev \
        perl \
        protobuf-c-dev \
    \
    && cd /usr/src/postgis \
    && gettextize \
    && ./autogen.sh \
    && ./configure \
        --enable-lto \
    && make -j${NPROC:-$(nproc)} \
    && make install \
    \
    && apk add --no-cache --virtual .postgis-rundeps \
        gdal \
        geos \
        proj \
        sfcgal \
        json-c \
        libstdc++ \
        pcre2 \
        protobuf-c \
        ca-certificates \
    \
    && cd / \
    && rm -rf /usr/src/postgis \
    && apk del .fetch-deps .build-deps

COPY initdb-postgis.sh /docker-entrypoint-initdb.d/10_postgis.sh
COPY update-postgis.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/update-postgis.sh