---
description: How to get started connecting to and deploying to a real server
---

# Introduction to Servers

## First Connect

Before we can do anything else, we want to make sure that we can remotely connect to our server via SSH manually, as *nix folks have been doing for hundreds of years. Depending on how the server is configured, you'll connect with either a username and password, a private key known to the server, or a public key known to the server. We'll look at each one below.

A requirement of all of these authentication methods is that you know the username of the account you're connecting to. You'll need to get this from your hosting/cloud provider, and it could be pretty different depending on who your host is:

* If you use AWS and create an EC2 instance from an Ubuntu image, the user will be `ubuntu`
* If you use Amazon's own Linux image, it'll be `ec2user`
* If you create a Digital Ocean Droplet the user will be `root`

Et cetera. Whatever it is, you'll need to know that before connecting.

But first, a note about a yes/no prompt you'll see the first time using any of these connection methods...

## Fingerprint Prompt

Using any of the auth methods below will lead to the following prompt the first time you connect, and it's because you've never connected to that server before:

```
The authenticity of host '137.184.224.112 (137.184.224.112)' can't be established.
ED25519 key fingerprint is SHA256:FHQDzxsqA68c+BhLPUkyN8aAVrznDtekhPg/99JXk8Q.
This key is not known by any other names
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

This is a quick security check making sure that you're actually connecting to the computer that you think you are. You can be reasonably sure that it is, so just type "yes". You'll get a note letting you know that it's been added to the list of known hosts (and you won't be prompted when connecting to this server again):

```
Warning: Permanently added '137.184.224.112' (ED25519) to the list of known hosts.
```

You can see a list of all known servers by looking in this file:

```
~/.ssh/known_hosts
```

:::info title=Reusing IP addresses

If you're connecting to cloud-based servers, turning them on and off, and potentially reusing IP addresses, you'll get an error message the next time you try to connect to that IP (because the signature of the server itself is now different and is different than what's stored in `known_hosts`. Find that line and delete it from `~/.ssh/known_hosts` and you'll be able to connect again.

:::

Once you're past that prompt you'll then either be prompted for your password, or logged in automatically (when using a private or public key). Let's look at each one in detail.

### Username/Password

Using username/password auth is pretty straight forward, just denote the user and server you want to connect to, either by its domain name or IP address. You will have created the password at the time you started your server, or maybe the host generated a random one.

```
ssh user@server.com
```

As a real example, here's how you would connect to a Digital Ocean Droplet. The user is `root` and the IP is `137.184.224.112`:

```
ssh root@137.184.224.112
```

### Private Key

Some providers, like AWS, will give you a private key at the time the server is created, rather than a password. This file usually ends in `.pem`. Make sure you know where you put this file on your computer because, for now, it's the only way you'll be able to connect to your server via SSH. I generally put them in the `~/.ssh` folder to keep all SSH-related stuff together.

:::info

Learn more about [public/private key authentication](https://www.ssh.com/academy/ssh/public-key-authentication). But the gist is that you create two keys, one public and one private. Either one can encrypt a document, but, only the private key can *decrypt* it. This means that anyone can have the public key and it can be freely distrubted (thus the "public" name), and the owner of the private key can always verify that it was encrypted using the related public key. A related technique can happen in reverse: the private key can be used to create a signature of a document, and the public key can be used to *verify* that the signature was created by the matching private key. So you can get the original message, and after verifying the signature, trust that it was sent by the owner of the private key.

You can't *decrypt* something with the public key that was encrypted with the private key, however. That would defeat the purpose of sharing the public key: anyone could read your message! If you need two-way encryption of messages then both parties could share their public keys and each would encrypt using the other party's public key.

:::

Before connecting, you'll want to change the file access permissions on the `.pem` file. This says that only the owner may access the file, and SSH will usually complain if anyone else has access to it. This is handled with the `chmod` command. The [octal version](https://chmodcommand.com/chmod-600/) of the permissions you want to set is the number `600`. To change the permission of the file:

`chmod 600 ~/.ssh/keyname.pem`

Where `keyname` is whatever the actual name of the file is. Once you do this you're ready to use it to connect. You still need the username and address of the server, but we're also going to set the `-i` flag which instructs SSH to use the private key listed:

```
ssh -i ~/.ssh/keyname.pem ubuntu@137.184.224.112
```

### Public Key

Some providers, like Digital Ocean, give you the opportunity to put your public key on the server automatically when it's created. This lets you avoid password and private key authentication completely, and is actually the preferred method of connecting via SSH that we'll end up with at the end of this guide!

If you don't really know what a public key is, where yours is at, or what it means to put it on the server, then skip ahead to the [Creating a Public Key](#creating-a-public-key) section and then come back here.

You'll need your username and server address and that's it:

```
ssh ubuntu@137.184.224.112
```

If your server doesn't let you pre-load your public key on the server, you'll need to do it manually. See [Adding Your SSH Public Key to the Server](#adding-your-ssh-public-key-to-the-server) below.

## Connected

Whatever auth method you go with, you should now be connected! If you get an error message that looks like this:

```
ubuntu@137.184.224.112: Permission denied (publickey,password).
```

It could be one of several things:

* The username is wrong
* The password is wrong
* The public key your system is trying to connect with is not found on the server in its `~/.ssh/authorized_keys` file
* The private key you passed with the `-i` flag is not found on the server

If you run the command again with the `-v` flag (verbose) you'll see everything that SSH is trying when it tries to log in. There are lots of resources on the internet to help you [troubleshoot](https://docs.digitalocean.com/support/how-to-troubleshoot-ssh-connectivity-issues/).

Assuming you did not get an error, you should be logged in:

```
Welcome to Ubuntu 22.04 LTS (GNU/Linux 5.15.0-41-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Wed Aug  3 21:09:41 UTC 2022

  System load:  0.25439453125     Users logged in:       0
  Usage of /:   6.3% of 24.05GB   IPv4 address for eth0: 137.184.224.112
  Memory usage: 22%               IPv4 address for eth0: 10.48.0.5
  Swap usage:   0%                IPv4 address for eth1: 10.124.0.2
  Processes:    97

0 updates can be applied immediately.

The programs included with the Ubuntu system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by
applicable law.

root@ubuntu-s-1vcpu-1gb-sfo3-01:~#
```

This is the welcome message on an Ubuntu machine, yours may be different.

The last line is actually your prompt where you can start typing commands.

## Simplifying Access

Having to type your username or include a private key each time is not fun. Luckily SSH uses public/private key cryptography, and can verify your identity using your public key. You've probably uploaded your public key to GitHub in the **Settings > SSH and GPG keys** section. We'll do something similar here: put our local machine's public key on the server so that it knows it's us when we connect, and skip the password.

:::info

If you're already using [public key auth](#public-key) then you can probably skip this section—you're already doing it!

:::

You can have multiple public keys from multiple development machines on the server so you can connect from multiple computers. This comes in very handy when working on a team: when someone leaves you just remove their public key from the server. Contrast this with password authentication, where you either need to share the password to a single deploy user to all of your teammates, and then change the password when someone leaves, or give everyone a copy of the server's private key and change *that* every time someone leaves. Just adding their public keys is much simpler to manage.

### Public/Private Keypairs

You may already have a public/private keypair! Check in `~/.ssh` and look for two files with the same name before the extension, one with `.pub` on the end (`id_rsa` and `id_rsa.pub`, for example). If you don't remember actually putting these files in the directory, then they were probably generated by a program like `ssh-keygen`, and ssh is already using them!

To see which of your keys SSH is already aware of, you can run this command to list them:

```
ssh-add -L
```

You should get zero or more lines containing public SSH keys, something like this:

```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQAB<REDACTED>3Edk1OE6BU6hK2EZchm= rob@computer.local
```

If I compare that to the content of my `~/.ssh/id_rsa.pub` file I can see that they match! Great, so SSH is already using my public key when it tries to connect. But what if I don't have a public/private keypair?

### Generating a Public/Private Keypair

There's a simple command to generate a new keypair:

```
ssh-keygen -t rsa -r 4096
```

You will be prompted for a couple of questions:

```
Generating public/private rsa key pair.
Enter file in which to save the key (/Users/rob/.ssh/id_rsa): sample_rsa
Enter passphrase (empty for no passphrase):
Enter same passphrase again:
```

If you don't have any keys, go ahead and use the default name (`id_rsa`).

A Passphrase is an additional line of security on your key. However, it also adds some inconvenience around using your public key: you'll need to enter the passpharse each time your private key is accessed. Which is great for security, but kind of defeats the purpose of sharing your public key with the server to make access easier. As long as you protect your private key, you shouldn't need to worry about adding a passphrase. Press ENTER (twice) to create your keypair without a passphrase.

Your keypair is generated!

```
Your identification has been saved in id_rsa
Your public key has been saved in id_rsa.pub
The key fingerprint is:
SHA256:g9tcaULSzcMLEoRREugBXEFotYdCicFZ4beRZRcTeMw rob@trion.local
The key's randomart image is:
+---[RSA 4096]----+
|*+OO**+o+=o      |
|oB+ +.++.E.      |
|.o = =o = =      |
|  o o o= . +     |
|     .. S =      |
|       + =       |
|      . o        |
|                 |
|                 |
+----[SHA256]-----+
```

::: info What's this randomart thing?

From this [Super User answer](https://superuser.com/a/22541):

> Validation is normally done by a comparison of meaningless strings (i.e. the hexadecimal representation of the key fingerprint), which humans are pretty slow and inaccurate at comparing. Randomart replaces this with structured images that are faster and easier to compare.

I suppose the idea is that if humans ever needed to compare public keys they could use the randomart version and know pretty quickly whether they're the same (instead of comparing 4096 bytes by eye!)

:::

### Adding to ssh-agent

Our key exists but does SSH know to use it yet? Let's ask `ssh-agent` (the tool that manages keys and makes them available to the actual `ssh` process):

```
ssh-add -L
```

Do you see your new public key listed? If not, we just have to let `ssh-agent` know where it is and to start using it:

```
ssh-add -T ~/.ssh/id_rsa.pub
```

Now running `ssh-add -L` should list our key.

### Adding Your SSH Public Key to the Server

So SSH is now presenting the key to the server, but the server doesn't know what to do with it.
