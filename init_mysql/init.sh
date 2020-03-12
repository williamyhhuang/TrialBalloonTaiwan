echo "import tbt data..."
mysql -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" tbt< /data/tbt_data_20200312.sql
echo "set mysql_native_password..."
mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e"ALTER USER 'test'@'%' IDENTIFIED WITH mysql_native_password BY '1234'";
echo "done"