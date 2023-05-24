#! /bin/bash

rm -rf ./tests/__generated__/
mkdir -p ./tests/__generated__/

yarn run proto-loader-gen-types \
  --longs=Long \
  --defaults=true \
  --arrays=true \
  --objects=true \
  --keepCase=true \
  --grpcLib=@grpc/grpc-js \
  --outDir="./tests/__generated__/" \
  "tests/service.proto"
