echo "jenkins start remove docker image"
docker rmi $(docker images -f "dangling=true" -q)
echo "jenkins start docker-compose"
/usr/local/bin/docker-compose up -d --build
echo "jenkins docker-compose done"