# catalog3d_frontend

## Instructions to run locally
1. Ensure you have [bun](https://bun.sh/) installed.
**Note**- Bun is a package manager just like npm but on steroids.
2. Ensure you have started [catalog3d_backend](https://github.com/aryanA101a/catalog3d_backend) locally.
3. `bun install`
4. `bun run dev`

## Deploy(from linux)
**Prerequisites**

Ensure you have the following:

- A private key file (.pem file) to authenticate with your server.
- SSH access to your server.
- Bun installed on your system.

**Steps**

1. Build the Project
`bun run build`

2. Clean Up the Server
`ssh -i /home/aryanarora/Downloads/commercenexgen.pem ubuntu@commercenexgen.com 'sudo rm -rf /var/www/html/* && rm -rf /home/ubuntu/build'`

3. Transfer Build Files
`scp -v -r -i /home/aryanarora/Downloads/commercenexgen.pem /home/aryanarora/learning/react/catalog3d/dist/* ubuntu@commercenexgen.com:/home/ubuntu/build/
`

4. Deploy to Web Directory
`ssh -i /home/aryanarora/Downloads/commercenexgen.pem ubuntu@commercenexgen.com "sudo cp -r /home/ubuntu/build/* /var/www/html/"
`


## Deploy(from windows)
**Prerequisites**
Ensure you have the following:

- PuTTY installed for SSH access.
- FileZilla installed for transferring files via SFTP.
- A private key file (.pem file) converted to a PuTTY-compatible .ppk file.
- Necessary build tools and configurations in your project.


1. Build the Project
`bun run build`

2. Clean Up the Server

    1. Open PuTTY:
        - Load your session settings, including the .ppk file for authentication.
        - Connect to your server by entering the server address.

    2. Execute Cleanup Commands:
        - Once connected, run the following command to remove existing files in the web directory and the previous build:
        
        `sudo rm -rf /var/www/html/* && rm -rf /home/ubuntu/build`

3. Transfer Build Files

    1. Open FileZilla: Configure it for your remote machine.

    2. Upload Files:
        - Navigate to the local build directory in the local pane.
        - Navigate to /home/ubuntu/build/ in the remote pane.
        Drag and drop all files from the local dist directory to the remote build directory.

4. Deploy to Web Directory

    1. Switch Back to PuTTY:
        After the file transfer is complete, return to your PuTTY session.

    2. Execute Deployment Command:
        Run the following command to move the files to the server’s web directory:

        `sudo cp -r /home/ubuntu/build/* /var/www/html/`

