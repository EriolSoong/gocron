FROM alpine:3.19

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories \
    && apk update \
    && apk add --no-cache ca-certificates tzdata \
    && addgroup -g 1000 app \
    && adduser -S -u 1000 -G app app

RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

WORKDIR /app

COPY bin/gocron-linux-amd64 ./gocron

RUN mkdir -p /app/conf /app/log /app/data \
    && chown -R app:app /app

EXPOSE 5920

USER app

ENTRYPOINT ["/app/gocron", "web"]
