# Momento's Interactive Booth

Welcome! If you're here, you were probably pointed this way from a blog post. That's cool. 

Looking for where this is implemented? [Look no further](https://conference.momentolabs.io).

## So..... what is it?

When Momento attends conferences, we like to have a little fun. So we built this interactive web app to engage conference go-ers and showcase some of what Momento has to offer.

### Temporary data storage

No time like the present, am I right?! When you log onto the app, we save your information to a cache for 24 hours. After that, it gets automatically deleted. Everything that happens in our game (that I'm about to explain) is also stored in said cache and deleted after a day as well.

Since we're at a conference, we don't need any of the game data for longer than a day, so we said "¡adios, database!" and opted to store everything remotely in Momento. This means we don't have any data cleanup to do between conferences, nice!

### Racing game

We've built in a racing game to this app. If you navigate to our [racer page](https://conference.momentolabs.io/racer) you'll be presented with three Momento-themed characters (the page is optimized for mobile, just FYI). Someone working the conference booth will have [the booth page open](https://conference.momentolabs.io/booth?race=true) and start the race for you.

As many people as you want can play, and everyone just needs to press a character as fast as they can as many times as they can. Each press will move their character on the booth page just a little bit. When the first character gets the end, the race is over!

This is built using both Momento Cache and Topics. The cache stores the game state. Basically just an `isRacing` flag. This sets the initial state of the racer page. If the game is racing all the buttons will be enabled. If it's waiting for someone to start it, the buttones will be disabled.

Whenever you press a character on the racer screen, a message is published via Momento Topics. This message is subscribed to by the racing page and will move the corresponding character over 1 pixel for every message it receives. When it moves a certain number of times, the race is over and the game state is updated.

That's it! The entire game is built without needing additional backend services. It's done completely through the front-end!

### Scavenger hunt

We've also added a scavenger hunt in there. One of the fun things we do at conferences is hide a bunch of QR codes around the venue. Users will walk around with their phones, scanning the QR codes as they find them. Once a code is scanned, their score is updated on the booth leaderboard automatically. 

Users cannot scan a code more than once and get credit for it. You also can't make up codes and monkey around with the url for bonus points. These are server-backed codes that are validated as you find them.

Once again, this is built without needing a backend service, it's done completely in the user interface. Using Momento cache, we can create a leaderboard by using a [sorted set cache item](https://docs.momentohq.com/develop/datatypes#sorted-sets). This will automatically handle the scores and sorting for us. 

We use Momento Topics to send a message to the leaderboard page to refresh whenever somebody finds a new code. Easy enough!
