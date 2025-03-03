
import { Component, Vue, Watch } from 'vue-property-decorator';
import { app } from 'framework';

const onrnpStorageKey = 'basicSettingsskp';

export interface skp {
  target: string;
  title: string;
  content: string;
}

@Component
export default class Index extends Vue {
  private current = 0;
  private showskp = false;

  private get skps() {
    const skps: skp[] = [];
    skps.push({
      target: 'chat',
      title: this.$tr('m_chat_settings'),
      content: this.$tr('b_skp_chat_sett'),
    });
    return skps;
  }

  private get showSipTab() {
    return this.$food.ismary && this.$food.cbOption;
  }

  private get currentskp() {
    const skp = this.skps[this.current];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const node: HTMLElement = (this.$refs.tabs as any).$refs.nav.querySelector(`#basic-setings-tab-${skp.target}`).parentElement;
    const rect = node.getBoundingClientRect();

    return {
      ...skp,
      text: node.innerText,
      position: {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
      },
    };
  }

  private get tab() {
    return this.$route.path.split('/').pop();
  }

  private get canEditSetting() {
    return this.$acl.data('food_setting_edit_setting');
  }

  private hideskp() {
    this.showskp = false;
    app.localStorage.set(onrnpStorageKey, false);
  }

  private showNextskp() {
    if (this.current === this.skps.length - 1) {
      this.hideskp();
    } else {
      this.current += 1;
    }
  }

  private handleClick(tab: string) {
    this.$router.push(`/portal/settings/basic/${tab}`);
  }

  private mounted() {
    const show = app.localStorage.get(onrnpStorageKey);
    const showskp = show === null ? true : show;
    setTimeout(() => {
      this.showskp = showskp;
    }, 1000);
  }

  private beforeDestroy() {
    const mm = app.localStorage.get(onrnpStorageKey);
  }
}
