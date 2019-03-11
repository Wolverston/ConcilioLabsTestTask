import { Component, OnInit, OnDestroy } from '@angular/core';
import { AppService } from './shared/app,service';
import { Subscription, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'ConcilioLabsTest';
  newsToShow = 30;
  newsSubscr = new Subscription;
  news = [];
  newsIDsSubscr = new Subscription;
  newsIDs;
  commentsSubscr = new Subscription;
  comments;
  commentatorsSubscr = new Subscription;
  commentators = [];
  topCommentators = [];
  minScore;
  message;
  isLoadingArticles;
  showApproach: Boolean = false;
  isLoadingCommentators;
  pendingCount: number = -30;
  params = {
    headers: {"X-RapidAPI-Key": "0ae4f92a5bmsh10517be152ff310p1eb2abjsn33f6b77830ac"}
  }
  constructor(private _appSrv: AppService, private _http: HttpClient){}
  showApproachFn(){
    this.showApproach = !this.showApproach;
  }
  sortObjByField(f){
    return function(a,b){
      return ( (a[f] < b[f] ) ? (1) : ( a[f] > b[f] ) ? -1 : 0 )
    }
  }
  addNewsItem(arr, item){
    arr.push(item);
    arr.sort(this.sortObjByField('score'));
    this.minScore = arr[arr.length-1].score;
  }
  startSearch(){
    this.isLoadingArticles = true;
    this.message = "Now getting top articles from Hacker news.";
    this.getTopNewsIDS().subscribe( res => {
      ( res.length ) ?
        this._appSrv.setSubject("newsIDs", res) : 
        console.log('no hits');
    })
  }
  ngOnInit(){
    this.newsIDsSubscr = this._appSrv.getSubject("newsIDs").subscribe( res => {
      this.newsIDs = res;
      let news = [];
      for (let i = 0; i < this.newsIDs.length; i++) {
        this.pendingCount++;
        this.minScore = 0;
        this.getSingleItemInfo(this.newsIDs[i]).subscribe( res => {
          if (news.length < this.newsToShow) {
            this.addNewsItem(news,res);
          } else {
            if (res.score > this.minScore) {
              news.splice(news.length-1,1);
              this.addNewsItem(news,res);
            }
            this._appSrv.setSubject('news', (news));
          }
        })
      }
      
    })

    this.newsSubscr = this._appSrv.getSubject("news").subscribe( res => {
      this.pendingCount--;
      if(!this.pendingCount) {
        this.news = res;
        // console.log(this.news);
        this.isLoadingArticles = false;
        this.isLoadingCommentators = true;
        this.message = "Now, when articles are ready, getting the commentators.";
        let comments = [];
        Array.prototype.forEach.call(this.news, newsItem=>{
          if (newsItem.kids) {
          let length = newsItem.kids.length >=10 ? 10 : newsItem.kids.length;
            for (let i = 0; i < length; i++) {
              comments.push(newsItem.kids[i]);
            }
          }
        })
        this._appSrv.setSubject('comments', comments);
      } 
    })
    this.commentsSubscr = this._appSrv.getSubject('comments').subscribe( res => {
      this.comments = res;
      console.log(this.comments);
      this.addCommentators(this.comments);
    })
  }
  addCommentators(arr){
    Array.prototype.forEach.call( arr, comment => {
      this.pendingCount++
      this.getSingleItemInfo(comment).subscribe( res => {
        this.pendingCount--;
        if (res && !res.deleted)
          this.commentators.push(res);
        if (!this.pendingCount) {
          // console.log(this.commentators)
          this.showTopCommentators();
        }
      })
    })
  }
  showTopCommentators(){
    Array.prototype.forEach.call( this.commentators, commentator=>{
      if ( this.topCommentators.filter( topC => { return topC.author.by == commentator.by } ).length > 0 ) {
        this.topCommentators.filter( topC => { if(topC.author.by == commentator.by) topC.count++ })
      } else {
        this.topCommentators.push({
          "author": commentator,
          "count": 1
        })
      }
    })
    this.topCommentators = this.topCommentators.sort(this.sortObjByField('count')).splice(0,10);
    // console.log(this.topCommentators)
    this.isLoadingCommentators = false;;
  }

  getTopNewsIDS(): Observable<any> {
    let query = "https://community-hacker-news-v1.p.rapidapi.com/topstories.json?print=pretty";
    return this._http.get(query, this.params )
  }

  getSingleItemInfo(id): Observable<any>{
    let query = "https://community-hacker-news-v1.p.rapidapi.com/item/"+id+".json?print=pretty";
    return this._http.get(query, this.params )
  }

  ngOnDestroy(){
    this.newsSubscr.unsubscribe();
    this.newsIDsSubscr.unsubscribe();
    this.commentsSubscr.unsubscribe();
  }
}
