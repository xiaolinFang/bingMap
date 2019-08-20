# Docker 搭建 angluar 前端应用

本项目代码维护在 https://github.com/yitonghub/angular_front

## Dockerfile 编写
1. 首先，选择官方的 node:10-alpine AS builder 作为项目基础镜像，编译 angular 应用，生成静态部署文件
2. 其次，由于该项目是纯静态文件，我们选择 Nginx 来作为 Web 服务器，将生成的静态文件拷贝到基于 Nginx 的环境中，部署到 Nginx中

```
FROM node:10-alpine AS builder
# set working directory
WORKDIR /app

# install and cache app dependencies
COPY ./package*.json ./
RUN npm install
COPY ./ ./

# build the angular app
RUN npm run build

FROM nginx:alpine

# configure ports and listeners with custom nginx.conf
RUN rm /etc/nginx/conf.d/default.conf
ADD ./default.conf /etc/nginx/conf.d/

# copy from dist to nginx root dir
COPY --from=builder /app/dist/bingMap/ /usr/share/nginx/html

# expose port 6501
EXPOSE 6501

# set author info
LABEL maintainer="maesinfo"

# run nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
```

## Nginx 配置自定义 default.conf
```
server {

    listen       6501;
    server_name  localhost;

    #server_name  apulis-china-infra01.apulis.com;
    #charset koi8-r;
    #access_log  /var/log/nginx/log/host.access.log  main;

    location /yitong {
        alias   /usr/share/nginx/html/;
        index  index.html index.htm;
        try_files $uri $uri/ /index.html;
    }
    location /proxy/ {
        proxy_pass https://apulis-china-infra01.apulis.com/;
    }
    #error_page  404              /404.html;
    # redirect server error pages to the static page /50x.html
    #
    error_page   500 502 503 504  /50x.html;
    location = /50x.html {
        root   html;
    }
}
```

## 宿主机 Nginx 配置 nginx_宿主机.conf
### 通过 nginx 容器监听不同端口，前端应可配置 nginx 集群，负载均衡
```
upstream angular_front {
    server x.x.x.x:6501;
}
```
```
server {
    listen 80;
    server_name x.com;

    location /yitong {
            proxy_set_header   Host             $host;
            proxy_set_header   x-forwarded-for  $remote_addr;
            proxy_set_header   X-Real-IP        $remote_addr;
            proxy_pass http://angular_front;
    }
        location /proxy {
            proxy_set_header   Host             $host;
            proxy_set_header   x-forwarded-for  $remote_addr;
            proxy_set_header   X-Real-IP        $remote_addr;
            proxy_pass http://angular_front;
    }
}
```

## angular_pull.sh
```
#!/bin/bash

proj=angular_front

# 判断源码目录是否存在
[ -d $proj ]&&{
        rm -rf $proj
        echo -e "\033[32m\n删除旧源码文件\n\033[0m"
}

# 拉取源代码
echo -e "\033[32m\n开始拉取源代码\n\033[0m"
git clone git@github.com:yitonghub/angular_front.git
echo -e "\033[32m\n拉取源代码\n\033[0m"

## 删除原镜像
docker rmi $proj &> /dev/null
echo  -e "\033[32m\n删除原镜像文件\n\033[0m"

cd ./$proj

# 构建镜像
docker build -t $proj .
echo -e "\033[32m\n新镜像构建成功\n\033[0m"


# 启动容器
docker run -p 6501:6501 -d --name $proj $proj
echo -e "\033[32m\n前端工程部署完成\n\033[0m"
```
