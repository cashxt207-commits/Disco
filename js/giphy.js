const GIPHY_KEY='GlVGYHkr3WSBnllca54iNt0yFbjz7L65';
const Giphy={
  async trending(){
    try{
      const r=await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_KEY}&limit=20&rating=g`);
      if(!r.ok)return this.fallback();
      const d=await r.json();
      return d.data.map(g=>({id:g.id,title:g.title,small:g.images.fixed_width_small.url,medium:g.images.fixed_width.url,original:g.images.original.url}));
    }catch{return this.fallback()}
  },
  async search(q){
    if(!q.trim())return this.trending();
    try{
      const r=await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_KEY}&q=${encodeURIComponent(q)}&limit=20&rating=g`);
      if(!r.ok)return this.fallbackSearch(q);
      const d=await r.json();
      return d.data.map(g=>({id:g.id,title:g.title,small:g.images.fixed_width_small.url,medium:g.images.fixed_width.url,original:g.images.original.url}));
    }catch{return this.fallbackSearch(q)}
  },
  async fallback(){
    try{
      const r=await fetch(`https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&limit=20`);
      const d=await r.json();
      return d.results.map(g=>({id:g.id,title:g.title||'',small:g.media_formats.tinygif.url,medium:g.media_formats.gif.url,original:g.media_formats.gif.url}));
    }catch{return[]}
  },
  async fallbackSearch(q){
    try{
      const r=await fetch(`https://tenor.googleapis.com/v2/search?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&q=${encodeURIComponent(q)}&limit=20`);
      const d=await r.json();
      return d.results.map(g=>({id:g.id,title:g.title||'',small:g.media_formats.tinygif.url,medium:g.media_formats.gif.url,original:g.media_formats.gif.url}));
    }catch{return[]}
  }
};
