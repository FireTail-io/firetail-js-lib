FROM node:18.7.0

WORKDIR /code

COPY . .
RUN npm install

COPY ./build_setup/enterpoint.sh /enterpoint.sh
RUN chmod +x /enterpoint.sh
ENTRYPOINT ["/enterpoint.sh"]

COPY ./build_setup/test.sh /test.sh
RUN chmod +x /test.sh
# ENTRYPOINT ["/test.sh"]

# CMD ["/bin/bash"]

# copy all files/dirs in root of project into code
# mouth 1)src, 2)sample, 3)__tests__, 4)dist into code

# docker build --no-cache -t test-build:latest -f build_setup/Dockerfile .

# docker run -it -p 3001:3001 -v ${PWD}/src:/code/src -v ${PWD}/sample:/code/sample -v ${PWD}/__tests__:/code/__tests__ -v ${PWD}/dist:/code/dist test-build:latest
