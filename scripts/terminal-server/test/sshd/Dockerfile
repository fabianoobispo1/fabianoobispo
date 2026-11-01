# sshd descartável com tmux para o teste de integração (NÃO usar em produção)
#   docker build -t webdeck-sshd-test test/sshd
#   docker run -d --rm --name wd-sshd -p 127.0.0.1:2222:22 webdeck-sshd-test
#   TEST_SSH_PORT=2222 npm test
FROM alpine:3.20
RUN apk add --no-cache openssh tmux bash \
 && ssh-keygen -A \
 && adduser -D -s /bin/bash dev && echo 'dev:devpass123' | chpasswd \
 && sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
EXPOSE 22
CMD ["/usr/sbin/sshd", "-D", "-e"]
