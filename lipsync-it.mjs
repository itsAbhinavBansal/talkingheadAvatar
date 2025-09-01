/**
 * @class Italian lip-sync processor
 * @author Shivendra Yadav
 */

class LipsyncIt {

  /**
   * @constructor
   */
  constructor() {

    // Italian phonetic rules adapted for Oculus visemes
    // Based on Italian phonetic patterns and pronunciation rules
    this.rules = {
      'A': [
        "[A] =aa", "[AI]=aa I", "[AU]=aa U", "[AE]=aa E", "[AO]=aa O",
        "[A]=aa"
      ],

      'B': [
        "[B]=PP"
      ],

      'C': [
        "[CH]=kk", "[CI]A=CH aa", "[CI]O=CH O", "[CI]U=CH U", "[CI]E=CH E",
        "[CI]=CH I", "[CE]=CH E", "[C]E=CH E", "[C]I=CH I", "[CC]=kk",
        "[C]=kk"
      ],

      'D': [
        "[D]=DD"
      ],

      'E': [
        "[E] =E", "[EI]=E I", "[EU]=E U", "[EA]=E aa", "[EO]=E O",
        "[E]=E"
      ],

      'F': [
        "[F]=FF"
      ],

      'G': [
        "[GH]=kk", "[GN]=nn", "[GI]A=kk aa", "[GI]O=kk O", "[GI]U=kk U",
        "[GI]E=kk E", "[GI]=kk I", "[GE]=kk E", "[G]E=kk E", "[G]I=kk I",
        "[GG]=kk", "[G]=kk"
      ],

      'H': [
        "[H]="
      ],

      'I': [
        "[I] =I", "[IA]=I aa", "[IE]=I E", "[IO]=I O", "[IU]=I U",
        "[I]=I"
      ],

      'J': [
        "[J]=kk"
      ],

      'K': [
        "[K]=kk"
      ],

      'L': [
        "[L]=nn"
      ],

      'M': [
        "[M]=PP"
      ],

      'N': [
        "[N]=nn"
      ],

      'O': [
        "[O] =O", "[OI]=O I", "[OU]=O U", "[OA]=O aa", "[OE]=O E",
        "[O]=O"
      ],

      'P': [
        "[P]=PP"
      ],

      'Q': [
        "[QU]=kk U", "[Q]=kk"
      ],

      'R': [
        "[R]=RR"
      ],

      'S': [
        "[SCH]=SS kk", "[SC]E=SS CH", "[SC]I=SS CH", "[SC]=SS kk",
        "[S]=SS"
      ],

      'T': [
        "[T]=DD"
      ],

      'U': [
        "[U] =U", "[UA]=U aa", "[UE]=U E", "[UI]=U I", "[UO]=U O",
        "[U]=U"
      ],

      'V': [
        "[V]=FF"
      ],

      'W': [
        "[W]=FF"
      ],

      'X': [
        "[X]=kk SS"
      ],

      'Y': [
        "[Y]=I"
      ],

      'Z': [
        "[Z]=SS"
      ]
    };

    const ops = {
      '#': '[AEIOU]+', // One or more vowels AEIOU
      '.': '[BDVGJLMNRWZ]', // One voiced consonant
      '%': '(?:MENTE|ZIONE|SIONE|ANDO|ENDO|ATO|ITO|UTO)', // Common Italian suffixes
      '&': '(?:[SCGZXJ]|CH|SH|GN|GL)', // Italian consonant clusters
      '@': '(?:[TSRDLZNJ]|TH|CH|SH|GN|GL)', // Extended consonant clusters
      '^': '[BCDFGHJKLMNPQRSTVWXZ]', // One consonant
      '+': '[EI]', // One of E, I
      ':': '[BCDFGHJKLMNPQRSTVWXZ]*', // Zero or more consonants
      ' ': '\\b' // Start/end of the word
    };

    // Convert rules to regex
    Object.keys(this.rules).forEach( key => {
      this.rules[key] = this.rules[key].map( rule => {
        const posL = rule.indexOf('[');
        const posR = rule.indexOf(']');
        const posE = rule.indexOf('=');
        const strLeft = rule.substring(0,posL);
        const strLetters = rule.substring(posL+1,posR);
        const strRight = rule.substring(posR+1,posE);
        const strVisemes = rule.substring(posE+1);

        const o = { regex: '', move: 0, visemes: [] };

        let exp = '';
        exp += [...strLeft].map( x => ops[x] || x ).join('');
        const ctxLetters = [...strLetters];
        ctxLetters[0] = ctxLetters[0].toLowerCase();
        exp += ctxLetters.join('');
        o.move = ctxLetters.length;
        exp += [...strRight].map( x => ops[x] || x ).join('');
        o.regex = new RegExp(exp);

        if ( strVisemes.length ) {
          strVisemes.split(' ').forEach( viseme => {
            o.visemes.push(viseme);
          });
        }

        return o;
      });
    });

    // Viseme durations in relative unit (1=average)
    // Adapted for Italian phonetic timing
    this.visemeDurations = {
      'aa': 0.95, 'E': 0.90, 'I': 0.92, 'O': 0.96, 'U': 0.95, 'PP': 1.08,
      'SS': 1.23, 'TH': 1, 'DD': 1.05, 'FF': 1.00, 'kk': 1.21, 'nn': 0.88,
      'RR': 0.88, 'CH': 1.15, 'sil': 1
    };

    // Pauses in relative units (1=average)
    this.specialDurations = { ' ': 1, ',': 3, '-':0.5, "'":0.5 };

    // Italian number words
    this.digits = ['zero', 'uno', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove'];
    this.ones = ['','uno','due','tre','quattro','cinque','sei','sette','otto','nove'];
    this.tens = ['','','venti','trenta','quaranta','cinquanta','sessanta','settanta','ottanta','novanta'];
    this.teens = ['dieci','undici','dodici','tredici','quattordici','quindici','sedici','diciassette','diciotto','diciannove'];

    // Symbols to Italian
    this.symbols = {
      '%': 'percento', '€': 'euro', '&': 'e', '+': 'più',
      '$': 'dollari'
    };
    this.symbolsReg = /[%€&\+\$]/g;
  }

  convert_digit_by_digit(num) {
    num = String(num).split("");
    let numWords = "";
    for(let m=0; m<num.length; m++) {
      numWords += this.digits[num[m]] + " ";
    }
    numWords = numWords.substring(0, numWords.length - 1); //kill final space
    return numWords;
  }

  convert_sets_of_two(num) {
    let firstNumHalf = String(num).substring(0, 2);
    let secondNumHalf = String(num).substring(2, 4);
    let numWords = this.convert_tens(firstNumHalf);
    numWords += " " + this.convert_tens(secondNumHalf);
    return numWords;
  }

  convert_millions(num){
    if (num>=1000000){
      return this.convert_millions(Math.floor(num/1000000))+" milioni "+this.convert_thousands(num%1000000);
    } else {
      return this.convert_thousands(num);
    }
  }

  convert_thousands(num){
    if (num>=1000){
      return this.convert_hundreds(Math.floor(num/1000))+" mila "+this.convert_hundreds(num%1000);
    } else {
      return this.convert_hundreds(num);
    }
  }

  convert_hundreds(num){
    if (num>99){
      return (Math.floor(num/100) === 1 ? "cento" : this.ones[Math.floor(num/100)]+" cento")+" "+this.convert_tens(num%100);
    } else {
      return this.convert_tens(num);
    }
  }

  convert_tens(num){
    if (num < 10){
      return (Number(num) != 0 && num.toString().startsWith("0") ? "zero " : "") + this.ones[Number(num)];
    } else if (num>=10 && num<20) {
      return this.teens[num-10];
    } else {
      // Handle Italian compound numbers (e.g., ventuno, ventotto)
      const tensDigit = Math.floor(num/10);
      const onesDigit = num%10;
      let tensWord = this.tens[tensDigit];
      
      if (onesDigit === 1 || onesDigit === 8) {
        // Drop final vowel from tens word before uno/otto
        tensWord = tensWord.slice(0, -1);
      }
      
      return tensWord + (onesDigit > 0 ? this.ones[onesDigit] : "");
    }
  }
 
  convertNumberToWords(num){
    if(num == "0"){
      return "zero";
    } else if(num.startsWith('0')){
      return this.convert_digit_by_digit(num);
    } else if ((num<1000&&num>99)||(num>10000&&num<1000000)) { //read area codes digit by digit
      return this.convert_digit_by_digit(num);
    } else if ((num > 1000 && num < 2000)||(num>2009&&num<3000)) { //read years as two sets of two digits
      return (num % 100 != 0 ? this.convert_sets_of_two(num) : this.convert_tens(num.substring(0, 2)) + " cento");
    } else {
      return this.convert_millions(num);
    }
  }

  /**
   * Preprocess text:
   * - convert symbols to words
   * - convert numbers to words
   * - filter out characters that should be left unspoken
   * - PRESERVE Italian accented characters (à, è, é, ì, ò, ù)
   * @param {string} s Text
   * @return {string} Pre-processsed text.
   */
  preProcessText(s) {
    return s.replace('/[#_*\":;]/g','')
      .replace( this.symbolsReg, (symbol) => {
        return ' ' + this.symbols[symbol] + ' ';
      })
      .replace(/(\d)\.(\d)/g, '$1 virgola $2') // Number separator (Italian uses "virgola" for decimal point)
      .replace(/\d+/g, this.convertNumberToWords.bind(this)) // Numbers to words
      .replace(/(\D)\1\1+/g, "$1$1") // max 2 repeating chars
      .replaceAll('  ',' ') // Only one repeating space
      // IMPORTANT: DO NOT remove diacritics for Italian - preserve à, è, é, ì, ò, ù, etc.
      .trim();
  }

  /**
   * Convert word to Oculus LipSync Visemes and durations
   * @param {string} w Text
   * @return {Object} Oculus LipSync Visemes and durations.
   */
  wordsToVisemes(w) {
    let o = { words: w.toUpperCase(), visemes: [], times: [], durations: [], i:0 };
    let t = 0;

    const chars = [...o.words];
    while( o.i < chars.length ) {
      const c = chars[o.i];
      const ruleset = this.rules[c];
      if ( ruleset ) {
        for(let i=0; i<ruleset.length; i++) {
          const rule = ruleset[i];
          const test = o.words.substring(0, o.i) + c.toLowerCase() + o.words.substring(o.i+1);
          let matches = test.match(rule.regex);
          if ( matches ) {
            rule.visemes.forEach( viseme => {
              if ( o.visemes.length && o.visemes[ o.visemes.length - 1 ] === viseme ) {
                const d = 0.7 * (this.visemeDurations[viseme] || 1);
                o.durations[ o.durations.length - 1 ] += d;
                t += d;
              } else {
                const d = this.visemeDurations[viseme] || 1;
                o.visemes.push( viseme );
                o.times.push(t);
                o.durations.push( d );
                t += d;
              }
            })
            o.i += rule.move;
            break;
          }
        }
      } else {
        o.i++;
        t += this.specialDurations[c] || 0;
      }
    }

    return o;
  }
}

export { LipsyncIt };