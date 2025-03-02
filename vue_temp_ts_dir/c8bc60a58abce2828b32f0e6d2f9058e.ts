
import { Component, Vue, Watch } from "vue-property-decorator";
import { app } from "framework";

const testStorageKey = "basicSettings";

export interface Antest {
  target: string;
  title: string;
  content: string;
}

@Component
export default class Index extends Vue {
  private current = 0;
  private showAntest = false;

  private get Antests() {
    const Antests: Antest[] = [];
    Antests.push({
      target: "cht",
      title: "label_cht",
      content: "Antest_cht_settings",
    });
    return Antests;
  }

  private get currentAntest() {
    const Antest = this.Antests[this.current];
    const node: HTMLElement = (this.$refs.tabs as any).$refs.nav.querySelector(
      `#basic-setings-tab-${Antest.target}`
    ).parentElement;
    const rect = node.getBoundingClientRect();

    return {
      ...Antest,
      text: node.innerText,
      position: {
        top: `${rect.top}px`,
        left: `${rect.left}px`,
      },
    };
  }

  private get tab() {
    return this.$route.path.split("/").pop();
  }

  private get canEditSetting() {
    return this.$acl.data("s_edit_setting");
  }

  private hideAntest() {
    this.showAntest = false;
    app.cookie.set(testStorageKey, false);
  }

  private showNextAntest() {
    if (this.current === this.Antests.length - 1) {
      this.hideAntest();
    } else {
      this.current += 1;
    }
  }

  private beforeDestroy() {
    const mm = app.cookie.get(testStorageKey);
    document.documentElement.style.overflow = "";
  }
}
