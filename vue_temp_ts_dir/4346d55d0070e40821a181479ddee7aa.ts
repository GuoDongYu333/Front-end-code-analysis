
import { Vue, Component } from 'vue-property-decorator';
import { namespace } from 'vuex-class';
const authModule = namespace('auth');

@Component
export default class Privacy extends Vue {
  @authModule.Action('registerRequest')
  private registerRequest!: ({username,password,email,avatar}: {username: string;password: string;email: string;avatar: string}) => void;

  private username = '';
  private password = '';
  private email = '';
  private avatar = '';

  async register(): Promise<void> {
    try {
      await this.registerRequest({
        username: this.username,
        password: this.password,
        email: this.email,
        avatar: this.avatar
      });
      // console.log('注册成功');
    } catch (e) {
      console.error(e);
    }
  }
}
