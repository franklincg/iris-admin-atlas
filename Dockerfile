FROM intersystemsdc/iris-community:2026.2
USER root
RUN mkdir -p /usr/irissys/csp/admin-atlas
COPY web/ /usr/irissys/csp/admin-atlas/
RUN chown -R 51773:51773 /usr/irissys/csp/admin-atlas
USER 51773
