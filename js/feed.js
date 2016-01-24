//Google Feed API
google.load("feeds", "1");
 
function initialize(){
  var feed = new google.feeds.Feed('http://blog.kairisa.com/feed?cat=12'); //feedのURL
  feed.setNumEntries(3); //記事の取得件数
  feed.load(function(result){
    if(!result.error){
     if(result.feed.entries.length == 0) return;
     var container = document.getElementById('feed');
      for(var i = 0; i < result.feed.entries.length; i++) {
        var entry = result.feed.entries[i];
        var publishedDate = new Date(entry.publishedDate);
        var link = document.createElement('a');
        link.href = entry.link;
        link.appendChild(document.createTextNode(publishedDate.toLocaleDateString()));
        link.appendChild(document.createTextNode(' - ' + entry.title));
        var li = document.createElement('li');
        li.appendChild(link);
        //記事がある場合のみ、ulとコーナータイトルを生成する
        if(i==0){
          var ul = document.createElement('ul');
          ul.className = 'unstyled';
          var cornerTitle = document.createElement('p');
          cornerTitle.appendChild(document.createTextNode('カテゴリー「WordPress」の記事'));
          container.appendChild(cornerTitle);
          container.appendChild(ul);
        }
        ul.appendChild(li);
      }
   }
 });
}
 
google.setOnLoadCallback(initialize);
