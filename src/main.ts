import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';



if (environment.production) {
  enableProdMode();
}

fetch('proxyconfig.json').then(res => res.json()).then((resp) => {
    console.log(res);
    console.log(resp);
    platformBrowserDynamic().bootstrapModule(AppModule)
    .catch(err => console.error(err));
}).catch(err => console.error(err));
