# deploy:
# 	bun run build
# 	ssh -i /home/aryanarora/Downloads/commercenexgen.pem ubuntu@commercenexgen.com 'sudo rm -rf /var/www/html/* && rm -rf /home/ubuntu/build'
# 	scp -v -r -i /home/aryanarora/Downloads/commercenexgen.pem /home/aryanarora/learning/react/catalog3d/dist/* ubuntu@commercenexgen.com:/home/ubuntu/build/
# 	ssh -i /home/aryanarora/Downloads/commercenexgen.pem ubuntu@commercenexgen.com "sudo cp -r /home/ubuntu/build/* /var/www/html/"
deploy:
	sudo rm -rf /var/www/catalog3d_integration/*
	bun run build
	sudo cp -r dist/* /var/www/catalog3d_integration