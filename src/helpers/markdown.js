import MarkdownIt from 'markdown-it';

const mk = new MarkdownIt('commonmark', { linkify: true, breaks: true });
mk.configure({
  components: {
    core: {
      rules: [
        'normalize',
        'block',
        'inline',
      ],
    },
    block: {
      rules: [
      ],
    },
    inline: {
      rules: [
        'autolink',
        'backticks',
        'emphasis',
        'entity',
        'escape',
        'html_inline',
        'newline',
        'text',
      ],
      rules2: [
        'balance_pairs',
        'emphasis',
        'text_collapse',
      ],
    },
  },
});

export default mk;
