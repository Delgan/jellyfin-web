define(["apiclientcore","localassetmanager","events","appStorage"],function(apiclientcorefactory,localassetmanager,events,appStorage){"use strict";var localPrefix="local:",localViewPrefix="localview:";return function(serverAddress,clientName,applicationVersion,deviceName,deviceId,devicePixelRatio){function getCurrentUser(){return apiclientcore.getCurrentUser().then(function(user){return appStorage.setItem("user-"+user.Id,JSON.stringify(user)),user},function(error){var userId=apiclientcore.getCurrentUserId();if(userId&&apiclientcore.accessToken()){var json=appStorage.getItem("user-"+userId);if(json)return Promise.resolve(JSON.parse(json))}return Promise.reject(error)})}function getUserViews(userId){return apiclientcore.getUserViews(userId).then(function(result){var serverInfo=apiclientcore.serverInfo();return serverInfo?getLocalView(serverInfo.Id,userId).then(function(localView){return localView&&(result.Items.push(localView),result.TotalRecordCount++),Promise.resolve(result)}):Promise.resolve(result)})}function getLocalView(serverId,userId){return getLocalFolders(serverId,userId).then(function(views){var localView=null;return views.length>0&&(localView={Name:self.downloadsTitleText||"Downloads",ServerId:serverId,Id:"localview",Type:"localview"}),Promise.resolve(localView)})}function getLocalFolders(userId){var serverInfo=apiclientcore.serverInfo();return userId=userId||serverInfo.UserId,localassetmanager.getViews(serverInfo.Id,userId)}function getItems(userId,options){var i,serverInfo=apiclientcore.serverInfo();if(serverInfo&&"localview"===options.ParentId)return getLocalFolders(serverInfo.Id,userId).then(function(items){var result={Items:items,TotalRecordCount:items.length};return Promise.resolve(result)});if(serverInfo&&options&&(isLocalId(options.ParentId)||isLocalViewId(options.ParentId)))return localassetmanager.getViewItems(serverInfo.Id,userId,options).then(function(items){items.forEach(function(item){adjustGuidProperties(item)}),items.sort(function(a,b){return a.SortName.toLowerCase().localeCompare(b.SortName.toLowerCase())});var result={Items:items,TotalRecordCount:items.length};return Promise.resolve(result)});if(options&&options.ExcludeItemIds&&options.ExcludeItemIds.length){var exItems=options.ExcludeItemIds.split(",");for(i=0;i<exItems.length;i++)if(isLocalId(exItems[i]))return Promise.resolve(createEmptyList())}else if(options&&options.Ids&&options.Ids.length){var ids=options.Ids.split(","),hasLocal=!1;for(i=0;i<ids.length;i++)isLocalId(ids[i])&&(hasLocal=!0);if(hasLocal)return localassetmanager.getItemsFromIds(serverInfo.Id,ids).then(function(items){items.forEach(function(item){adjustGuidProperties(item)});var result={Items:items,TotalRecordCount:items.length};return Promise.resolve(result)})}return apiclientcore.getItems(userId,options)}function getItem(userId,itemId){itemId&&(itemId=itemId.toString());var serverInfo;return isLocalViewId(itemId)&&(serverInfo=apiclientcore.serverInfo())?getLocalFolders(serverInfo.Id,userId).then(function(items){var views=items.filter(function(item){return item.Id===itemId});return views.length>0?Promise.resolve(views[0]):Promise.reject()}):isLocalId(itemId)&&(serverInfo=apiclientcore.serverInfo())?localassetmanager.getLocalItem(serverInfo.Id,stripLocalPrefix(itemId)).then(function(item){return adjustGuidProperties(item.Item),Promise.resolve(item.Item)}):apiclientcore.getItem(userId,itemId)}function adjustGuidProperties(downloadedItem){downloadedItem.Id=convertGuidToLocal(downloadedItem.Id),downloadedItem.SeriesId=convertGuidToLocal(downloadedItem.SeriesId),downloadedItem.SeasonId=convertGuidToLocal(downloadedItem.SeasonId),downloadedItem.AlbumId=convertGuidToLocal(downloadedItem.AlbumId),downloadedItem.ParentId=convertGuidToLocal(downloadedItem.ParentId),downloadedItem.ParentThumbItemId=convertGuidToLocal(downloadedItem.ParentThumbItemId),downloadedItem.ParentPrimaryImageItemId=convertGuidToLocal(downloadedItem.ParentPrimaryImageItemId),downloadedItem.PrimaryImageItemId=convertGuidToLocal(downloadedItem.PrimaryImageItemId),downloadedItem.ParentLogoItemId=convertGuidToLocal(downloadedItem.ParentLogoItemId),downloadedItem.ParentBackdropItemID=convertGuidToLocal(downloadedItem.ParentBackdropItemID),downloadedItem.ParentBackdropImageTags=null}function convertGuidToLocal(guid){return guid?isLocalId(guid)?guid:"local:"+guid:null}function getNextUpEpisodes(options){return options.SeriesId&&isLocalId(options.SeriesId)?Promise.resolve(createEmptyList()):apiclientcore.getNextUpEpisodes(options)}function getSeasons(itemId,options){return isLocalId(itemId)?(options.ParentId=itemId,getItems(apiclientcore.getCurrentUserId(),options)):apiclientcore.getSeasons(itemId,options)}function getEpisodes(itemId,options){return isLocalId(options.SeasonId)?(options.ParentId=options.SeasonId,getItems(apiclientcore.getCurrentUserId(),options)):isLocalId(options.seasonId)?(options.ParentId=options.seasonId,getItems(apiclientcore.getCurrentUserId(),options)):isLocalId(itemId)?(options.ParentId=itemId,options.Recursive=!0,getItems(apiclientcore.getCurrentUserId(),options).then(function(items){var items2=items.Items.filter(function(item){return"episode"===item.Type.toLowerCase()}),result={Items:items2,TotalRecordCount:items2.length};return Promise.resolve(result)})):apiclientcore.getEpisodes(itemId,options)}function getThemeMedia(userId,itemId,inherit){return isLocalViewId(itemId)||isLocalId(itemId)?Promise.reject():apiclientcore.getThemeMedia(userId,itemId,inherit)}function getSimilarItems(itemId,options){return isLocalId(itemId)?Promise.resolve(createEmptyList()):apiclientcore.getSimilarItems(itemId,options)}function updateFavoriteStatus(userId,itemId,isFavorite){return isLocalId(itemId)?Promise.resolve():apiclientcore.updateFavoriteStatus(userId,itemId,isFavorite)}function getScaledImageUrl(itemId,options){if(isLocalId(itemId)||options&&options.itemid&&isLocalId(options.itemid)){var serverInfo=apiclientcore.serverInfo(),id=stripLocalPrefix(itemId);return localassetmanager.getImageUrl(serverInfo.Id,id,options.type,0)}return apiclientcore.getScaledImageUrl(itemId,options)}function onWebSocketMessage(e,msg){events.trigger(self,"websocketmessage",[msg])}function getPlaybackInfo(itemId,options,deviceProfile){return isLocalId(itemId)?localassetmanager.getLocalItem(apiclientcore.serverId(),stripLocalPrefix(itemId)).then(function(item){var mediaSources=item.Item.MediaSources.map(function(m){return m.SupportsDirectPlay=!0,m.SupportsDirectStream=!1,m.SupportsTranscoding=!1,m.IsLocal=!0,m});return{MediaSources:mediaSources}}):localassetmanager.getLocalItem(apiclientcore.serverId(),itemId).then(function(item){if(item){var mediaSources=item.Item.MediaSources.map(function(m){return m.SupportsDirectPlay=!0,m.SupportsDirectStream=!1,m.SupportsTranscoding=!1,m.IsLocal=!0,m});return localassetmanager.fileExists(item.LocalPath).then(function(exists){if(exists){var res={MediaSources:mediaSources};return Promise.resolve(res)}return apiclientcore.getPlaybackInfo(itemId,options,deviceProfile)})}return apiclientcore.getPlaybackInfo(itemId,options,deviceProfile)})}function reportPlaybackStart(options){if(!options)throw new Error("null options");return isLocalId(options.ItemId)?Promise.resolve():apiclientcore.reportPlaybackStart(options)}function reportPlaybackProgress(options){if(!options)throw new Error("null options");return isLocalId(options.ItemId)?Promise.resolve():apiclientcore.reportPlaybackProgress(options)}function reportPlaybackStopped(options){if(!options)throw new Error("null options");if(isLocalId(options.ItemId)){var serverInfo=apiclientcore.serverInfo(),action={Date:(new Date).getTime(),ItemId:stripLocalPrefix(options.ItemId),PositionTicks:options.PositionTicks,ServerId:serverInfo.Id,Type:0,UserId:apiclientcore.getCurrentUserId()};return localassetmanager.recordUserAction(action)}return apiclientcore.reportPlaybackStopped(options)}function getIntros(itemId){return isLocalId(itemId)?Promise.resolve({Items:[],TotalRecordCount:0}):apiclientcore.getIntros(itemId)}function getInstantMixFromItem(itemId,options){return isLocalId(itemId)?Promise.resolve({Items:[],TotalRecordCount:0}):apiclientcore.getInstantMixFromItem(itemId,options)}function getItemDownloadUrl(itemId){if(isLocalId(itemId)){var serverInfo=apiclientcore.serverInfo();if(serverInfo)return localassetmanager.getLocalItem(serverInfo.Id,stripLocalPrefix(itemId)).then(function(item){return Promise.resolve(item.LocalPath)})}return apiclientcore.getItemDownloadUrl(itemId)}function isLocalId(str){return startsWith(str,localPrefix)}function isLocalViewId(str){return startsWith(str,localViewPrefix)}function stripLocalPrefix(str){var res=stripStart(str,localPrefix);return res=stripStart(res,localViewPrefix)}function startsWith(str,find){return!!(str&&find&&str.length>find.length&&0===str.indexOf(find))}function stripStart(str,find){return startsWith(str,find)?str.substr(find.length):str}function createEmptyList(){var result={Items:[],TotalRecordCount:0};return result}var apiclientcore=new apiclientcorefactory(serverAddress,clientName,applicationVersion,deviceName,deviceId,devicePixelRatio),self=Object.assign(this,apiclientcore);events.on(apiclientcore,"websocketmessage",onWebSocketMessage),Object.defineProperty(self,"onAuthenticated",{get:function(){return apiclientcore.onAuthenticated},set:function(newValue){apiclientcore.onAuthenticated=newValue}}),Object.defineProperty(self,"enableAutomaticBitrateDetection",{get:function(){return apiclientcore.enableAutomaticBitrateDetection},set:function(newValue){apiclientcore.enableAutomaticBitrateDetection=newValue}}),self.getLatestOfflineItems=function(options){options.SortBy="DateCreated",options.SortOrder="Descending";var serverInfo=apiclientcore.serverInfo();return serverInfo?localassetmanager.getViewItems(serverInfo.Id,null,options).then(function(items){return items.forEach(function(item){adjustGuidProperties(item)}),Promise.resolve(items)}):Promise.resolve([])},self.getCurrentUser=getCurrentUser,self.getUserViews=getUserViews,self.getItems=getItems,self.getItem=getItem,self.getLocalFolders=getLocalFolders,self.getSeasons=getSeasons,self.getEpisodes=getEpisodes,self.getThemeMedia=getThemeMedia,self.getNextUpEpisodes=getNextUpEpisodes,self.getSimilarItems=getSimilarItems,self.updateFavoriteStatus=updateFavoriteStatus,self.getScaledImageUrl=getScaledImageUrl,self.getPlaybackInfo=getPlaybackInfo,self.reportPlaybackStart=reportPlaybackStart,self.reportPlaybackProgress=reportPlaybackProgress,self.reportPlaybackStopped=reportPlaybackStopped,self.getIntros=getIntros,self.getInstantMixFromItem=getInstantMixFromItem,self.getItemDownloadUrl=getItemDownloadUrl}});