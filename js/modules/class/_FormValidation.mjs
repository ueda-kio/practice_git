import { submitContact } from "../_submitContact.mjs";

export class Validation {
  constructor(form) {
    this.form = form;
    this.isInvalid = new Map();
    this.inputs = form.querySelectorAll('input, textarea, select');
    this.validate = {
      /**
       * 文字数が足りているか
       * @param _input 対象のテキストフィールド
       * @returns エラーメッセージ
       */
      minLength: (_input) => {
        if (!_input.getAttribute('minLength')) {
          return '';
        }

        const input = _input;
        const minlength = Number(input.getAttribute('minlength')); // for IE

        return minlength <= input.value.trim().length ? '' : `${minlength}文字以上入力してください。`;
      },

      /**
       * 文字数が超えていないか
       * @param _input 対象のテキストフィールド
       * @returns エラーメッセージ
       */
      maxLength: (_input) => {
        if (!_input.getAttribute('maxLength')) {
          return '';
        }

        const input = _input;

        return input.value.trim().length <= input.maxLength ? '' : `${input.maxLength}文字以下で入力してください。`;
      },

      /**
       * 必須項目が入力されているか
       * @param _formControls 対象のフォームコントロール
       * @returns エラーメッセージ
       */
      required: (_formControls) => {
        if (!_formControls.required) {
          return '';
        }

        const input = _formControls;

        if (input.type === 'checkbox') {
          return input.checked ? '' : 'このフィールドは入力必須です。';
        } else if (input.type === 'radio') {
          const isChecked = form.querySelectorAll(`input[type="radio"][name="${input.name}"]:checked`).length !== 0;

          return isChecked ? '' : 'このフィールドは入力必須です。';
        }

        if (input.value.trim() === '') {
          if (input.dataset.errorMessage) {
            return input.dataset.errorMessage;
          }

          return 'このフィールドは入力必須です。';
        }

        return '';
      },

      /**
       * pattern属性のルールに適合しているか
       * @param _input 対象のテキストフィールド
       * @returns エラーメッセージ
       */
      pattern: (_input) => {
        if (!_input.getAttribute('pattern') || !_input.required) {
          return '';
        }

        const input = _input;
        const pattern = new RegExp(input.pattern);

        if (pattern.test(input.value)) {
          return '';
        }

        // title属性に説明があればそれを出力する
        return input.title || '指定されている形式で入力してください。';
      }
    };

    /**
     * 出力するエラーメッセージのマークアップを作る
     * @param messages エラーメッセージリスト
     * @returns エラーメッセージ
     */
    const result = (messages) => {
      const arr = [];

      for (const msg of messages) {
        if (msg) {
          arr.push(msg);
        }
      }

      return arr.join('<br>');
    };

    /**
     * errorIdの取得
     * @param input 対象のテキストフィールド
     * @returns エラーメッセージ
     */
    const getErrorId = (input) => {
      let errorId = input.dataset.radioGroupError;

      if (!errorId) {
        if (input.dataset.errorId) {
          errorId = `${input.dataset.errorId}-error`;
        } else {
          errorId = `${input.id}-error`;
        }
      }

      return errorId;
    };

    /**
     * error状態の解除
     * @param input 対象のテキストフィールド
     * @returns {void}
     */
    const resetInputErrorState = (input) => {
      const type = input.type;
      const inputElms = type === 'radio' ? form.querySelectorAll(`input[type="radio"][name="${input.name}"]`) : [input];
      const errorId = getErrorId(input);
      const error = document.getElementById(errorId);
      const labels = document.querySelectorAll(`[for="${input.id}"]`);

      if (error) {
        error.textContent = '';
      }

      inputElms.forEach((input) => {
        input.classList.remove('is-error');
      })

      labels.forEach((label) => {
        label.classList.remove('is-error');
      })

      if (input.dataset.errorId) {
        const label = document.getElementById(input.dataset.errorId);

        if (label) {
          label.classList.remove('is-error');
        }
      }
    };

    const getHandler = (input) => {
      const errorId = getErrorId(input);
      const error = document.getElementById(errorId);
      const labels = document.querySelectorAll(`[for="${input.id}"]`);
      let isValid = true;

      const errorMessage = result([
        this.validate.minLength(input),
        this.validate.maxLength(input),
        this.validate.required(input),
        this.validate.pattern(input),
      ]);

      if (isValid) {
        isValid = errorMessage === '';
      }

      // 対象のフォームコントロールの入力値が妥当かどうかは
      // error文言があるかどうかを判定してMapに格納する
      if (!isValid) {
        this.isInvalid.set(input, true);
        input.classList.add('is-error');

        // labelに.is-error付与
        labels.forEach((label) => {
          label.classList.add('is-error');
        })

        if (errorMessage) {
          error.textContent = '';
          error.insertAdjacentHTML('afterbegin', errorMessage);
        } else {
          // errorMessageが空で、isValidがfalseの時は、他に不正な入力項目があるケース
          this.isInvalid.set(input, false);
          input.classList.remove('is-error');
        }
      } else {
        this.isInvalid.set(input, false);
        resetInputErrorState(input);
      }
    }

    /**
     * イベントリスナのバインド
     */
    const addEvents = () => {
      const submit = document.getElementById('submit');

      this.inputs.forEach((input) => {
        input.addEventListener('input', (e) => {
          getHandler(e.currentTarget);
        })
      })

      submit.addEventListener('click', (e) => {
        e.preventDefault();

        this.inputs.forEach((input) => {
          getHandler(input)
        });

        for (const [input, state] of this.isInvalid) {
          if (state) {
            input.focus();

            return false;
          }
        }

        console.log('OK!');
        submitContact(this.form);
      });
    }

    /**
     * 初期化
     */
    const init = () => {
      form.noValidate = true;
      addEvents();
    };

    init();
  }
}

document.querySelectorAll('.js-form-validate').forEach((el) => {
  new Validation(el);
})
