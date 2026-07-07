FROM alpine:3.19

RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tuna.tsinghua.edu.cn/g' /etc/apk/repositories \
    && apk update \
    && apk add --no-cache ca-certificates tzdata \
    && addgroup -S app \
    && adduser -S -g app app

RUN cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

WORKDIR /app

# 复制本地构建的静态二进制（由 make build-linux 产出）
COPY bin/gocron-linux-amd64 ./gocron

# 创建默认配置文件，安装向导会回写数据库配置
RUN mkdir -p /app/conf \
    && printf '[default]\ndb.engine=mysql\ndb.host=127.0.0.1\ndb.port=3306\ndb.user=\ndb.password=\ndb.database=\nallow_ips=\n' > /app/conf/app.ini

RUN chown -R app:app ./

EXPOSE 5920

USER app

ENTRYPOINT ["/app/gocron", "web"]
