
# React Project Boilier Plate V2

This boiler plate consist with:

1. module scss
2. Javascript helper
3. prettier-lint, and default setting as below:

```
tabWidth: 4
trailingComma: all
semi: true
singleQuote: true
useTabs: false
quoteProps: preserve
```

## Before clone this project:（下載專案前請看！）

windows 的電腦，請在終端機先進行以下操作

`git config --global core.autocrlf false`

### 原因：

windows 下和 linux 下的文本文件的換行符不一致。

windows: cr + lf

linux: lf


# Running with Docker scripts show as following:

有兩個選項可以順利在 Dokcer 上執行
* 第一選項： Docker 內打包出 build 及 docker image（適用主機為Mac）

* 第二選項： 本地先打包出 build 再複製進入 Docker 製成 docker image（針對 Window 主機，及其他不是 Mac 的主機）


## 選擇一、在 Docker 虛擬容器內，完成打包專案及 image

### Step 1 製作 image，方式有二：

1. 透過 `docker-compose.prod.yml` 執行 `Dockerfile` 製作 image 

    ```
    docker-compose -f docker-compose.prod.yml build
    ```

2. 直接執行 `Dockerfile` 製作 image

    ```
    docker build -t react-app:nginx .
    ```

### Step 2 Container 執行，方式有二：

1. 透過指令

    ```
    docker run -p 80:80 --name react-app app-prod
    ```

2. 直接在 Docker App 操作


## 選擇二、將打包好的專案複製進入 Docker 運行

1. `npm run build`

2. `docker build -t react-app:nginx .`

3. 記得修改 Dockerfile 成以下
    ```
    FROM nginx:stable-alpine as production
    ENV NODE_ENV production
    # Copy build assets from builder
    COPY build /usr/share/nginx/html
    # Add your nginx.conf
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    # Expose port
    EXPOSE 80
    # Start nginx
    CMD ["nginx", "-g", "daemon off;"]
    ```
