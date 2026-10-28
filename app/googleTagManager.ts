export const googleTagManagerId = "GTM-KPR2RQPG";
export const googleTagManagerNoscriptUrl = `https://www.googletagmanager.com/ns.html?id=${googleTagManagerId}`;

// Basic consent mode: the container is loaded only after the existing banner's
// combined analytics/marketing choice. Consent commands precede gtm.js.
export const googleTagManagerScript = `(function(w,d){
  if(w.__MLT_GTM_INITIALIZED__)return;
  w.__MLT_GTM_INITIALIZED__=true;
  w.dataLayer=w.dataLayer||[];
  w.gtag=w.gtag||function(){w.dataLayer.push(arguments);};
  var key='mlt-cookie-consent',loaded=false;
  function state(permitted){return {
    analytics_storage:permitted?'granted':'denied',
    ad_storage:permitted?'granted':'denied',
    ad_user_data:permitted?'granted':'denied',
    ad_personalization:permitted?'granted':'denied'
  };}
  w.gtag('consent','default',state(false));
  function savedConsent(){
    try{
      var saved=JSON.parse(w.localStorage.getItem(key)||'null');
      return !!saved&&saved.analytics===true&&(saved.choice==='all'||saved.choice==='preferences');
    }catch(e){return false;}
  }
  function load(){
    if(loaded)return;
    loaded=true;
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(w,d,'script','dataLayer','${googleTagManagerId}');
  }
  function apply(permitted){
    w.gtag('consent','update',state(permitted));
    w.dataLayer.push({event:'mlt_consent_update',analytics:permitted});
    if(permitted)load();
  }
  w.addEventListener('mlt-consent-change',function(event){apply(!!event.detail&&event.detail.analytics===true);});
  w.addEventListener('storage',function(event){if(event.key===key)apply(savedConsent());});
  if(savedConsent())apply(true);
})(window,document);`;
