var gmailbuttons = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("gmailbuttons-strings");	
  },
  
  GetMessageServer: function() {
    // get current message
	var hdr = gFolderDisplay.selectedMessage;
    // give up if no message selected or this is a dummy header
    if (!hdr || gMessageDisplay.isDummy) 
      return;
	// get folder that contains message
	var fldr = hdr.folder;
	if (!fldr) // message not in folder somehow?
		return;
	// get server that hosts folder
	var svr = fldr.server;
	if (!svr) // folder does not have server?
		return;
	return svr;
  },
  
  // returns true if message is in gmail imap
  IsMessageGmailIMAP: function() {	
	var gmailHostNames = ["imap.gmail.com", "imap.googlemail.com"]; // TODO - pull these to a config file
	var svr = this.GetMessageServer();
	if (svr) 
	  return gmailHostNames.indexOf(svr.hostName) >= 0;
	return false;
  },
  
  updateJunkSpamButtons: function() {
	
	// get message-specific header buttons	
	var deleteButton = document.getElementById("hdrTrashButton");
	var trashButton = document.getElementById("gmailbuttons-trash-button");
	var junkButton = document.getElementById("hdrJunkButton");
	var spamButton = document.getElementById("gmailbuttons-spam-button");
	
	if (this.IsMessageGmailIMAP()) { // this is a gmail imap account
	  deleteButton.oldTooltipText = deleteButton.tooltipText;
	  deleteButton.tooltipText = this.strings.getString("deleteButton.tooltip");
	  // TODO hide the delete button based on preference
	  trashButton.hidden = false;
	  junkButton.hidden = true;
	  spamButton.hidden = false;
	} else { // this is not a gmail account
	  if (deleteButton.oldTooltipText)
	    deleteButton.tooltipText = deleteButton.oldTooltipText;
	  trashButton.hidden = true; // TODO hide trash button if we are in the [Gmail]/Trash folder
	  junkButton.hidden = false;
	  spamButton.hidden = true;
	}
  },
  
  // handle message header load events
  messageHandler: {
	onStartHeaders: function() {
		// do nothing
	},
	
	onEndHeaders: function() {
		gmailbuttons.updateJunkSpamButtons();
	},
	
	onEndAttachments: function() {
		// do nothing
	}	
  },

  // moves the selected message to the [Gmail]/Trash folder
  MoveToTrash: function(e) {
    if (this.IsMessageGmailIMAP()) { // mesage is on gmail imap server
	  var svr = this.GetMessageServer();
	  var gmailFolder = svr.rootFolder.getChildNamed("[Gmail]");
	  if (gmailFolder) {
	    gmailTrashFolder = gmailFolder.getChildNamed("Trash");
		if (gmailTrashFolder) {
		  gFolderDisplay.hintAboutToDeleteMessages();
          gDBView.doCommandWithFolder(nsMsgViewCommandType.moveMessages, gmailTrashFolder);
		  //return; // otherwise show error mesage below
		}
      }
	} // trash button should not be visivle if not a gmail imap message
	// TODO may want error message here
  },

  // moves the selected message to the [Gmail]/Spam folder
  MoveToSpam: function(e) {
    if (this.IsMessageGmailIMAP()) { // mesage is on gmail imap server
	  var svr = this.GetMessageServer();
	  var gmailFolder = svr.rootFolder.getChildNamed("[Gmail]");
	  if (gmailFolder) {
	    gmailTrashFolder = gmailFolder.getChildNamed("Spam");
		if (gmailTrashFolder) {
		  gFolderDisplay.hintAboutToDeleteMessages();
          gDBView.doCommandWithFolder(nsMsgViewCommandType.moveMessages, gmailTrashFolder);
		  //return; // otherwise show error mesage below
		}
      }
	} // trash button should not be visivle if not a gmail imap message
	// TODO may want error message here
  }    
};

// listen for initial window load event
window.addEventListener("load", function () { gmailbuttons.onLoad(); }, false);
// listen for messages loading
gMessageListeners.push(gmailbuttons.messageHandler);