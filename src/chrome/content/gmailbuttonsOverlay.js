var gmailbuttons = {
  onLoad: function() {
    // initialization code
    this.initialized = true;
    this.strings = document.getElementById("gmailbuttons-strings");	
    // add support for preferences
    this.prefs = Components.classes["@mozilla.org/preferences-service;1"]  
        .getService(Components.interfaces.nsIPrefService)  
        .getBranch("extensions.gmailbuttons.");  
    this.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);  
    this.prefs.addObserver("", this, false); 
  },
  
  onUnload: function() {
    // cleanup preferences
    this.prefs.removeObserver("", this);  
  },
  
  observe: function(aSubject, aTopic, aData) {  
    if (aTopic != "nsPref:changed") {  
      return; // only need to act on pref change
    }  
    // process change	
    switch(aData) {  
      case "showDeleteButton":  
         this.updateJunkSpamButtons();
         break;  
      }  
  },  
  
  GetMessageFolder: function() {
    // get current message
    var header = gFolderDisplay.selectedMessage;
    // give up if no message selected or this is a dummy header
    if (!header || gMessageDisplay.isDummy) 
      return;
    // get folder that contains message
    var folder = header.folder;
    if (!folder) // message not in folder somehow?
      return;	
    return folder;
  },  
  
  GetMessageServer: function() {
    var folder = this.GetMessageFolder();
    if (!folder) // message not in folder somehow?
      return;
    // get server that hosts folder
    var server = folder.server;
    if (!server) // folder does not have server?
      return;
    return server;
  },
  
  // returns true if message is in Gmail imap
  IsServerGmailIMAP: function(aServer) {
    // check that server parameter is valid
    if (!(aServer instanceof Ci.nsIImapIncomingServer))
      return;
    // check to see if it is imap and Gmail server
    return (aServer.type == "imap" && aServer.isGMailServer);
  },
  
  IsSpecialFolder: function(aFolder, aFlag) {
    // make sure aFolder is a valid folder
    if (!(aFolder instanceof Ci.nsMessageFolder))
      return;
    // check if aFolder has special folder flag
    return aFolder.isSpecialFolder(aFlag);
  },
  
  updateJunkSpamButtons: function() {
    
    /* get message-specific header buttons */
    var deleteButton = document.getElementById("hdrTrashButton");
    var trashButton = document.getElementById("gmailbuttons-trash-button");
    var junkButton = document.getElementById("hdrJunkButton");
    var spamButton = document.getElementById("gmailbuttons-spam-button");
        
    if (this.IsServerGmailIMAP(this.GetMessageServer())) { 
      // this is a Gmail imap account
    
      /* get actual folder names from server  */
      try {
        var server = this.GetMessageServer();
        var serverRootFolder = server.rootFolder;
        var trashFolder = this.getSpecialFolder(serverRootFolder, nsMsgFolderFlags.Trash);
        var spamFolder = this.getSpecialFolder(serverRootFolder, nsMsgFolderFlags.Junk);
      } catch(ex) {
        // don't need to do anything here
        //alert(ex);
      }
      // get label text
      var trashLabel = trashFolder ? trashFolder.prettiestName : 
          this.strings.getString("gmailbuttons.error");
      var spamLabel = spamFolder ? spamFolder.prettiestName : 
          this.strings.getString("gmailbuttons.error");
      // get tooltip text
      var trashTooltip = trashFolder ? 
          this.strings.getFormattedString("gmailbuttons.moveButton.tooltip",
          [trashFolder.URI.replace(serverRootFolder.URI, "").substr(1)], 1) : 
          this.strings.getString("gmailbuttons.error");
      var spamTooltip = spamFolder ? 
          this.strings.getFormattedString("gmailbuttons.moveButton.tooltip",
          [spamFolder.URI.replace(serverRootFolder.URI, "").substr(1)], 1) : 
          this.strings.getString("gmailbuttons.error");  
    
      if (deleteButton) {
        // save the original tooltip - this only runs once
        if (!deleteButton.oldTooltipText)
          deleteButton.oldTooltipText = deleteButton.tooltipText;
        // apply new tooltip
        deleteButton.tooltipText = this.strings.getString("gmailbuttons.deleteButton.tooltip");
      try {
        var showDelete = this.prefs.getBoolPref("showDeleteButton")		
        deleteButton.hidden = !showDelete;
        } catch(ex) {
        // preference does not exist - do nothing
      }
        }
      if (trashButton) {
        trashButton.hidden = false;
        trashButton.label = trashLabel;
        trashButton.tooltipText = trashTooltip;
      }
      if (junkButton)
        junkButton.hidden = true;
      if (spamButton)	{
        spamButton.hidden = false;
        spamButton.label = spamLabel;      
        spamButton.tooltipText = spamTooltip;
      }    
    } else { 
      // this is not a GMail account
      
      if (deleteButton) {
        if (deleteButton.oldTooltipText)
          deleteButton.tooltipText = deleteButton.oldTooltipText;
      deleteButton.hidden = false;
        }
      if (trashButton)	
          // if (!IsSpecialFolder(this.getMessageFolder(), Ci.nsMsgFolderFlags.Trash))	  
        trashButton.hidden = true; // TODO hide trash button if we are in the [Gmail]/Trash folder
      if (junkButton)
        junkButton.hidden = false;
      if (spamButton)
        spamButton.hidden = true;
    }
  },
  
  // unhides all buttons - used during customization of toolbar
  showAllButtons: function() {
	
	// get message-specific header buttons	
	var deleteButton = document.getElementById("hdrTrashButton");
	var trashButton = document.getElementById("gmailbuttons-trash-button");
	var junkButton = document.getElementById("hdrJunkButton");
	var spamButton = document.getElementById("gmailbuttons-spam-button");
		
	// show all buttons
	if (deleteButton) 
      deleteButton.hidden = false;
	if (trashButton)
	  trashButton.hidden = false;
	if (junkButton)
	  junkButton.hidden = false;
	if (spamButton)	
	  spamButton.hidden = false;	
  },
    
  // handle message header load events
  messageListener: {
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
  
  folderDisplayListener: {
     onMessagesLoaded: function(aAll) {
       try {
        var hideJunkStatusCol = gmailbuttons.prefs.getBoolPref("hideJunkStatusCol")		
        // don't need to do anything if pref doesn't exist or is false
        if(!hideJunkStatusCol)
         return;
        // get the server from the selected folder
        var server = aAll.displayedFolder.server;
        if (!server)
          return;
        if (gmailbuttons.IsServerGmailIMAP(server)) {      
          // hide junk status column
          var junkStatusColumn = document.getElementById("junkStatusCol");
          if (junkStatusColumn) {
            junkStatusColumn.hidden = true;
          }
        }
      } catch(ex) {
        // preference does not exist - do nothing
        //alert(ex);
      }
    },  
  },
  
  onBeforeCustomization: function(aEvent) { 
    if (aEvent.target.id == "header-view-toolbox")
      gmailbuttons.showAllButtons();
  },
  
  onAfterCustomization: function(aEvent) {   
    if (aEvent.target.id == "header-view-toolbox")  
      gmailbuttons.updateJunkSpamButtons();
  },

  // search for folder flagged as a special folder. i.e. Trash and Spam folders
  getSpecialFolder: function(aFolder, aFlag) {
    /* TODO would be nice if we could do this directly using XPATH */
    
    
    
    /* for now, we use recurstion to search folders instead */
	
    // make sure we have a valid folder
    if (!(aFolder instanceof Ci.nsIMsgFolder))
      return;
    // if aFolder is flagged with aFlag, return it
    if (aFolder.isSpecialFolder(aFlag))
      return aFolder;
    // otherwise, search recursivly
    if (aFolder.hasSubFolders) {
      var subfolders = aFolder.subFolders;
      while (subfolders.hasMoreElements()) {
        var subfolder = subfolders.getNext();
        var result = this.getSpecialFolder(subfolder, aFlag);
          if (result)
            return result;
      }
    }
    // no trash folders were found
    return;
  },
  
  // moves the selected message to a special folder. i.e. [Gmail]/Trash
  MoveToSpecialFolder: function(aFlag, aEvent) {
    var server = this.GetMessageServer();
    if (this.IsServerGmailIMAP(server)) { // mesage is on Gmail imap server	  
      var specialFolder = this.getSpecialFolder(server.rootFolder, aFlag);	  
        if (specialFolder) {
      gFolderDisplay.hintAboutToDeleteMessages();
          gDBView.doCommandWithFolder(nsMsgViewCommandType.moveMessages, specialFolder);
      //return; // otherwise show error mesage below
      }  
    } // trash button should not be visible if not a Gmail imap message
	// TODO may want error message here
  }
};

// listen for initial window load event
window.addEventListener("load", function () { gmailbuttons.onLoad(); }, false);
// listen for window unload event
window.addEventListener("unload", function () { gmailbuttons.onUnload(); }, false);
// listen for customization events
window.addEventListener("beforecustomization", function (e) { gmailbuttons.onBeforeCustomization(e); }, false);
window.addEventListener("aftercustomization", function (e) { gmailbuttons.onAfterCustomization(e); }, false);
// listen for messages loading
gMessageListeners.push(gmailbuttons.messageListener);
// listen for folder selection
FolderDisplayListenerManager.registerListener(gmailbuttons.folderDisplayListener);