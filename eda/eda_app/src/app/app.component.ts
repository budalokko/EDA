import { Component, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { AlertService, UserService, SpinnerService } from './services/service.index';
import { Router } from '@angular/router';

import { PrimeNGConfig } from 'primeng/api';

import * as _ from 'lodash';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styles: [],
    providers: [MessageService]
})
export class AppComponent implements OnInit {
    displaySpinner: boolean = false;

    constructor(
        private userService: UserService,
        private spinnerService: SpinnerService,
        private router: Router,
        public alertService: AlertService,
        public messageService: MessageService,
        private config: PrimeNGConfig
    ) { }



    ngOnInit(): void {
        this.initializeAlertService();
        this.initializeSpinnerService();
        this.setTranslations();
    }

    private initializeSpinnerService(): void {
        // Spinner Service
        this.spinnerService.getSpinner$.subscribe(displaySpinner => this.displaySpinner = displaySpinner);
    }

    private initializeAlertService(): void {
        // Alert Service
        this.alertService.getAlerts$.subscribe(alert => {

            this.messageService.add({
                severity: alert.severity,
                summary: alert.summary,
                detail: alert.detail
            });

            if (!_.isNil(alert.nextPage)) {
                if (_.isEqual(alert.nextPage, 'logout')) {
                    this.userService.logout();
                }

                if (_.isEqual(alert.nextPage, 'home')) {
                    this.router.navigate(['/home']);
                }
            }
        });
    }

    private setTranslations() {

        const url = window.location.href;
        let lan_ca = new RegExp('\/ca\/', 'i');
        let lan_es = new RegExp('\/es\/', 'i');

        console.log(lan_ca.test(url), lan_es.test(url))

        if (lan_ca.test(url)) {
            this.config.setTranslation(
                {
                    dayNames: ["Diumenge", "Dilluns", "Dimarts", "Dimecres", "Dijous", "Divendres", "Dissabte"],
                    dayNamesShort: ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"],
                    dayNamesMin: ["Dl", "Dm", "Dc", "Dj", "Dv", "Ds", "Dm"],
                    monthNames: ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
                    monthNamesShort: ["Gen", "Febr", "Març", "Abr", "Maig", "Juny", "Jul", "Ag", "Set", "Oct", "Nov", "Des"],
                    today: 'Avui',
                    clear: 'Netejar',
                    weekHeader: 'Setmana'
                }
            )


        }
        else if (lan_es.test(url)) {
            this.config.setTranslation(
                {
                    dayNames: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"],
                    dayNamesShort: ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"],
                    dayNamesMin: ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"],
                    monthNames: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
                    monthNamesShort: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dec"],
                    today: 'Hoy',
                    clear: 'Limpiar',
                    weekHeader: 'Semana'
                }
            )
        }

        else {

            this.config.setTranslation(
                {
                    dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
                    dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
                    dayNamesMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"],
                    monthNames: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
                    monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
                    today: 'Today',
                    clear: 'Clear',
                    weekHeader: 'Wk'
                }
            )

        }

    }


}
