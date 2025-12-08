#!/bin/bash

PID_FILE="/tmp/static-server.pid"
LOG_FILE="/tmp/static-server.log"
PORT=9080
MAX_WAIT=30

# Funcao para verificar se a porta esta em uso
port_in_use() {
    lsof -i :$PORT >/dev/null 2>&1 || netstat -tuln 2>/dev/null | grep -q ":$PORT " || ss -tuln 2>/dev/null | grep -q ":$PORT "
}

# Remove PID file antigo e mata processo se existir
if [ -f "$PID_FILE" ]; then
    OLD_PID=$(cat "$PID_FILE")
    if kill -0 "$OLD_PID" 2>/dev/null; then
        echo "Parando servidor anterior (PID: $OLD_PID)..."
        kill "$OLD_PID" 2>/dev/null
        for i in $(seq 1 10); do
            kill -0 "$OLD_PID" 2>/dev/null || break
            sleep 0.5
        done
        kill -0 "$OLD_PID" 2>/dev/null && kill -9 "$OLD_PID" 2>/dev/null
    fi
    rm -f "$PID_FILE"
fi

# Mata qualquer processo na porta
if port_in_use; then
    echo "Porta $PORT em uso, liberando..."
    fuser -k $PORT/tcp 2>/dev/null || true
    sleep 2
fi

# Aguarda a porta ficar livre
COUNTER=0
while port_in_use && [ $COUNTER -lt 10 ]; do
    echo "Aguardando porta $PORT liberar..."
    sleep 1
    COUNTER=$((COUNTER + 1))
done

if port_in_use; then
    echo "ERRO: Porta $PORT ainda em uso"
    exit 1
fi

echo "Iniciando static-server na porta $PORT..."

# Inicia o servidor completamente desacoplado
nohup npx -y static-server -p $PORT > "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo $SERVER_PID > "$PID_FILE"

# Desacopla do processo pai
disown $SERVER_PID 2>/dev/null

echo "Servidor iniciado com PID: $SERVER_PID"

# Aguarda o servidor subir
echo "Aguardando servidor ficar disponivel..."
COUNTER=0
while [ $COUNTER -lt $MAX_WAIT ]; do
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT" 2>/dev/null | grep -qE "200|301|302|304"; then
        echo "Servidor pronto em http://localhost:$PORT"
        echo "Log em: $LOG_FILE"
        exit 0
    fi
    sleep 1
    COUNTER=$((COUNTER + 1))
    echo -n "."
done

echo ""
echo "ERRO: Servidor nao iniciou em $MAX_WAIT segundos"
cat "$LOG_FILE"
kill $SERVER_PID 2>/dev/null
rm -f "$PID_FILE"
exit 1
