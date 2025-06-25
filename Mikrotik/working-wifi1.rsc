# jun/22/2025 21:30:49 by RouterOS 6.49.18
# software id = 7KQU-U42G
#
# model = 951Ui-2HnD
# serial number = HGH09N57KCH
/interface bridge
add name=bridge-hotspot
/interface wireless
set [ find default-name=wlan1 ] disabled=no mode=ap-bridge ssid=Tunyce-WiFi
/interface wireless security-profiles
set [ find default=yes ] supplicant-identity=MikroTik
/ip hotspot profile
add hotspot-address=192.168.88.1 login-by=mac,http-chap,http-pap \
    mac-auth-password=wifi name=hsprof1 use-radius=yes
/ip hotspot user profile
set [ find default=yes ] idle-timeout=2m
/ip pool
add name=hs-pool ranges=192.168.88.2-192.168.88.254
/ip dhcp-server
add address-pool=hs-pool disabled=no interface=bridge-hotspot lease-time=1h \
    name=dhcp1
/ip hotspot
add address-pool=hs-pool disabled=no interface=bridge-hotspot name=hotspot1 \
    profile=hsprof1
/tool user-manager customer
set admin access=\
    own-routers,own-users,own-profiles,own-limits,config-payment-gw
/interface bridge port
add bridge=bridge-hotspot interface=ether5
add bridge=bridge-hotspot interface=wlan1
/ip neighbor discovery-settings
set discover-interface-list=!dynamic
/ip address
add address=192.168.88.1/24 comment="hotspot network" interface=\
    bridge-hotspot network=192.168.88.0
/ip dhcp-client
add disabled=no interface=ether1
/ip dhcp-server network
add address=192.168.88.0/24 comment="hotspot network" dns-server=192.168.88.1 \
    gateway=192.168.88.1
/ip dns
set allow-remote-requests=yes
/ip dns static
add address=192.168.100.158 name=login.tunyce.local
add address=192.168.88.1 name=. ttl=1m
/ip firewall filter
add action=accept chain=input dst-port=53 protocol=udp
add action=accept chain=input dst-port=53 protocol=tcp
add action=passthrough chain=unused-hs-chain comment=\
    "place hotspot rules here" disabled=yes
/ip firewall nat
add action=passthrough chain=unused-hs-chain comment=\
    "place hotspot rules here" disabled=yes
add action=masquerade chain=srcnat out-interface=ether1
add action=redirect chain=pre-hotspot dst-port=53 protocol=udp to-ports=53
add action=redirect chain=pre-hotspot dst-port=53 protocol=udp to-ports=53
add action=redirect chain=pre-hotspot dst-port=53 protocol=udp to-ports=53
add action=redirect chain=pre-hotspot dst-port=53 protocol=udp to-ports=53
add action=masquerade chain=srcnat comment="masquerade hotspot network" \
    src-address=192.168.88.0/24
add action=masquerade chain=srcnat comment="masquerade hotspot network" \
    src-address=192.168.88.0/24
add action=masquerade chain=srcnat comment="masquerade hotspot network" \
    src-address=192.168.88.0/24
add action=redirect chain=dstnat comment="Trap TCP DNS too" dst-port=53 \
    protocol=tcp to-ports=53
/ip hotspot user
add name=admin password=admin
/ip hotspot walled-garden
add comment="place hotspot rules here" disabled=yes
add dst-host=wifi.portal
add dst-host=wifi.portal
add dst-host=192.168.100.158
add dst-host=192.168.100.160
add dst-port=53
add dst-host=192.168.88.1
add dst-host=192.168.100.160
/ip hotspot walled-garden ip
add action=accept disabled=no dst-address=192.168.100.158
add action=accept disabled=no dst-address=192.168.100.157
add action=accept disabled=no dst-address=192.168.100.158
add action=accept disabled=no dst-address=192.168.100.159
add action=accept disabled=no dst-address=192.168.100.160
/ip service
set telnet address=0.0.0.0/0
set www address=0.0.0.0/0
set ssh address=0.0.0.0/0
set www-ssl address=0.0.0.0/0
/radius
add address=192.168.100.159 secret=testing123 service=hotspot timeout=3s
/system clock
set time-zone-name=America/New_York
/system identity
set name=matatu1test
/system ntp client
set enabled=yes primary-ntp=132.163.96.1 secondary-ntp=132.163.97.1
/system scheduler
add interval=1d name=autosave on-event="/system backup save name=autosave" \
    policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon \
    start-date=may/31/2025 start-time=00:05:00
/tool user-manager database
set db-path=user-manager
/tool user-manager user
add customer=admin disabled=no ipv6-dns=:: password=test shared-users=1 \
    username=test wireless-enc-algo=none wireless-enc-key="" wireless-psk=""
/user aaa
set use-radius=yes
