FROM intersystemsdc/iris-community:latest
USER root
RUN mkdir -p /home/irisowner/irisbuild && chown -R 51773:51773 /home/irisowner/irisbuild
USER 51773
WORKDIR /home/irisowner/irisbuild
COPY --chown=51773:51773 . .
RUN iris start IRIS && iris session IRIS < iris.script && iris stop IRIS quietly
