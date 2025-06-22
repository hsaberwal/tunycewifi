FROM freeradius/freeradius-server:latest

RUN apt-get update && apt-get install -y curl

# Copy main clients.conf to accept all IPs with a shared secret
COPY clients.conf /etc/freeradius/clients.conf

# Copy module and site configs
COPY mods-available/ /etc/freeradius/mods-available/
COPY mods-enabled/ /etc/freeradius/mods-enabled/
COPY sites-available/ /etc/freeradius/sites-available/
COPY sites-enabled/ /etc/freeradius/sites-enabled/
COPY scripts/check_mac.sh /etc/freeradius/scripts/check_mac.sh
COPY scripts/log_reject.sh /etc/freeradius/scripts/log_reject.sh
RUN chmod +x /etc/freeradius/scripts/check_mac.sh
RUN chmod +x /etc/freeradius/scripts/log_reject.sh

COPY mods-config/exec/authorize_mac_check /etc/freeradius/mods-config/exec/authorize_mac_check
RUN ln -s /etc/freeradius/mods-config/exec/authorize_mac_check /etc/freeradius/mods-enabled/authorize_mac_check
RUN ln -s /etc/freeradius/mods-available/reject_logger /etc/freeradius/mods-enabled/reject_logger


# (Optional) Copy users file if you're using it
# COPY users /etc/freeradius/mods-config/files/authorize

# (Optional) Enable debug mode by default
CMD ["freeradius", "-X"]

