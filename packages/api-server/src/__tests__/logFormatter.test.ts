import chalk from 'chalk'

import { LogFormatter } from '../logFormatter/index'

const logFormatter = LogFormatter()

describe('LogFormatter', () => {
  describe('Formats log levels as emoji', () => {
    test('Formats Trace level', () => {
      expect(logFormatter({ level: 10 })).toMatch('🧵')
    })

    test('Formats Debug level', () => {
      expect(logFormatter({ level: 20 })).toMatch('🐛')
    })

    test('Formats Info level', () => {
      expect(logFormatter({ level: 30 })).toMatch('🌲')
    })

    test('Formats Warn level', () => {
      expect(logFormatter({ level: 40 })).toMatch('🚦')
    })

    test('Formats Error level', () => {
      expect(logFormatter({ level: 50 })).toMatch('🚨')
    })
  })

  describe('Formats log messages', () => {
    test('Formats newline-delimited json data with a message', () => {
      expect(
        logFormatter({ level: 10, message: 'Message in a bottle' })
      ).toMatch('Message in a bottle')
    })

    test('Formats newline-delimited json data with a msg', () => {
      expect(logFormatter({ level: 10, msg: 'Message in a bottle' })).toMatch(
        'Message in a bottle'
      )
    })

    test('Formats a text message', () => {
      expect(logFormatter('Handles text data')).toMatch('Handles text data')
    })

    test('Formats Get Method and Status Code', () => {
      const logData = { level: 10, method: 'GET', statusCode: 200 }
      expect(logFormatter(logData)).toMatch('GET')
      expect(logFormatter(logData)).toMatch('200')
    })

    test('Formats Post Method and Status Code', () => {
      const logData = { level: 10, method: 'POST', statusCode: 200 }
      expect(logFormatter(logData)).toMatch('POST')
      expect(logFormatter(logData)).toMatch('200')
    })
  })

  describe('Formats GraphQL injected log data from useRedwoodLogger plugin', () => {
    test('Handles query', () => {
      expect(
        logFormatter({
          level: 10,
          query: {
            id: 1,
          },
        })
      ).toMatch('"id": 1')
    })

    test('Handles operation name', () => {
      expect(
        logFormatter({ level: 10, operationName: 'GET_BLOG_POST_BY_ID' })
      ).toMatch('GET_BLOG_POST_BY_ID')
    })

    test('Handles GraphQL data', () => {
      expect(
        logFormatter({
          level: 10,
          data: { post: { id: 1, title: 'My Blog Post' } },
        })
      ).toMatch('My Blog Post')
    })

    test('Handles browser user agent', () => {
      const userAgent =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.1 Safari/605.1.15'
      expect(
        logFormatter({
          level: 10,
          userAgent,
        })
      ).toMatch(/Mozilla.*AppleWebKit.*Safari/)
    })
  })

  describe('Custom log data', () => {
    test('Should include the custom log attribute text', () => {
      expect(
        logFormatter({
          level: 10,
          custom: 'I should see this custom message text',
        })
      ).toMatch('I should see this')
    })

    test('Should include the custom log attribute info with a special emoji and label', () => {
      expect(
        logFormatter({
          level: 10,
          custom: 'I should see this custom emoji and label',
        })
      ).toMatch('🗒  Metadata')
    })

    test('Should include the custom log attribute info with nested text message', () => {
      expect(
        logFormatter({
          level: 10,
          custom: {
            msg: 'I should see this custom message in the log',
          },
        })
      ).toMatch('I should see this custom message in the log')
    })
  })

  test('Should include the custom log attribute info with a number attribute', () => {
    expect(
      logFormatter({
        level: 10,
        custom: {
          msg: 'I should see this custom message and number in the log',
          number: 100,
        },
      })
    ).toMatch('100')
  })

  test('Should include the custom log attribute info with a nested object attribute', () => {
    expect(
      logFormatter({
        level: 10,
        custom: {
          msg: 'I should see this custom object in the log',
          obj: { foo: 'bar' },
        },
      })
    ).toMatch('"foo": "bar"')
  })

  test('Should include the custom log attribute info with a nested object attribute', () => {
    expect(
      logFormatter({
        level: 10,
        custom: {
          msg: 'I should see this custom object in the log',
          obj: { foo: 'bar' },
        },
      })
    ).toMatch('"foo": "bar"')
  })

  describe('text input', () => {
    it('Should format graphql logs with data, requestId, userAgent and operationName enabled, plus response cache configured', () => {
      expect(
        logFormatter(
          '{"level":20,"time":1652375352844,"pid":41826,"hostname":"Tobbes-MacBook-Pro.local","name":"rw-graphql-server","operationName":"BlogPostsQuery","query":{},"requestId":"req-4","userAgent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.147 Safari/537.36","data":{"blogPosts":[{"id":1,"title":"A little more about me","body":"Raclette shoreditch before they sold out lyft. Ethical bicycle rights meh prism twee. Tote bag ennui vice, slow-carb taiyaki crucifix whatever you probably haven\'t heard of them jianbing raw denim DIY hot chicken. Chillwave blog succulents freegan synth af ramps poutine wayfarers yr seitan roof party squid. Jianbing flexitarian gentrify hexagon portland single-origin coffee raclette gluten-free. Coloring book cloud bread street art kitsch lumbersexual af distillery ethical ugh thundercats roof party poke chillwave.","createdAt":"2022-05-07T07:41:21.150Z","__typename":"Post"},{"id":2,"title":"What is the meaning of life?","body":"Meh waistcoat succulents umami asymmetrical, hoodie post-ironic paleo chillwave tote bag. Trust fund kitsch waistcoat vape, cray offal gochujang food truck cloud bread enamel pin forage. Roof party chambray ugh occupy fam stumptown. Dreamcatcher tousled snackwave, typewriter lyft unicorn pabst portland blue bottle locavore squid PBR&B tattooed.","createdAt":"2022-05-07T07:41:21.150Z","__typename":"Post"},{"id":3,"title":"Welcome to the blog!","body":"I\'m baby single- origin coffee kickstarter lo - fi paleo skateboard.Tumblr hashtag austin whatever DIY plaid knausgaard fanny pack messenger bag blog next level woke.Ethical bitters fixie freegan,helvetica pitchfork 90\'s tbh chillwave mustache godard subway tile ramps art party. Hammock sustainable twee yr bushwick disrupt unicorn, before they sold out direct trade chicharrones etsy polaroid hoodie. Gentrify offal hoodie fingerstache.","createdAt":"2022-05-07T07:41:21.150Z","__typename":"Post"}]},"responseCache":{"hit":false,"didCache":true,"ttl":null},"msg":"GraphQL execution completed: BlogPostsQuery"}'
        )
      ).toEqual(
        [
          `${chalk.gray('19:09:12')} 🐛 ${chalk.blue(
            'rw-graphql-server'
          )} ${chalk.cyan('req-4')} ${chalk.yellow(
            'GraphQL execution completed: BlogPostsQuery'
          )} `,
          chalk.white('\n🏷  BlogPostsQuery') + ' ',
          chalk.white(
            [
              '\n📦 Result Data',
              '{',
              '  "blogPosts": [',
              '    {',
              '      "id": 1,',
              '      "title": "A little more about me",',
              '      "body": "Raclette shoreditch before they sold out lyft. Ethical bicycle rights meh prism twee. Tote bag ennui vice, slow-carb taiyaki crucifix whatever you probably haven\'t heard of them jianbing raw denim DIY hot chicken. Chillwave blog succulents freegan synth af ramps poutine wayfarers yr seitan roof party squid. Jianbing flexitarian gentrify hexagon portland single-origin coffee raclette gluten-free. Coloring book cloud bread street art kitsch lumbersexual af distillery ethical ugh thundercats roof party poke chillwave.",',
              '      "createdAt": "2022-05-07T07:41:21.150Z",',
              '      "__typename": "Post"',
              '    },',
              '    {',
              '      "id": 2,',
              '      "title": "What is the meaning of life?",',
              '      "body": "Meh waistcoat succulents umami asymmetrical, hoodie post-ironic paleo chillwave tote bag. Trust fund kitsch waistcoat vape, cray offal gochujang food truck cloud bread enamel pin forage. Roof party chambray ugh occupy fam stumptown. Dreamcatcher tousled snackwave, typewriter lyft unicorn pabst portland blue bottle locavore squid PBR&B tattooed.",',
              '      "createdAt": "2022-05-07T07:41:21.150Z",',
              '      "__typename": "Post"',
              '    },',
              '    {',
              '      "id": 3,',
              '      "title": "Welcome to the blog!",',
              '      "body": "I\'m baby single- origin coffee kickstarter lo - fi paleo skateboard.Tumblr hashtag austin whatever DIY plaid knausgaard fanny pack messenger bag blog next level woke.Ethical bitters fixie freegan,helvetica pitchfork 90\'s tbh chillwave mustache godard subway tile ramps art party. Hammock sustainable twee yr bushwick disrupt unicorn, before they sold out direct trade chicharrones etsy polaroid hoodie. Gentrify offal hoodie fingerstache.",',
              '      "createdAt": "2022-05-07T07:41:21.150Z",',
              '      "__typename": "Post"',
              '    }',
              '  ]',
              '}',
            ].join('\n')
          ) + ' ',
          chalk.white(
            [
              '\n💾 Response Cache',
              '{',
              '  "hit": false,',
              '  "didCache": true,',
              '  "ttl": null',
              '}',
            ].join('\n')
          ) + ' ',
          chalk.gray(
            '\n🕵️‍♀️ Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.147 Safari/537.36'
          ),
          '\n',
        ].join('')
      )
    })

    it('Should format basic graphql logs', () => {
      expect(
        logFormatter(
          '{"level":20,"time":1652380326869,"pid":46072,"hostname":"Tobbes-MacBook-Pro.local","name":"rw-graphql-server","msg":"GraphQL execution completed: BlogPostsQuery"}'
        )
      ).toMatchSnapshot()
    })

    it('Should format api server request logs', () => {
      expect(
        logFormatter(
          '{"level":30,"time":1652380326855,"pid":46072,"hostname":"Tobbes-MacBook-Pro.local","name":"api-server","reqId":"req-5","req":{"method":"POST","url":"/graphql","hostname":"localhost:8910","remoteAddress":"::1","remotePort":64671},"msg":"incoming request"}'
        )
      ).toMatchSnapshot()
    })

    it('Should format api server response logs', () => {
      expect(
        logFormatter(
          '{"level":30,"time":1652380326869,"pid":46072,"hostname":"Tobbes-MacBook-Pro.local","name":"api-server","reqId":"req-4","res":{"statusCode":200},"responseTime":48.36454105377197,"msg":"request completed"}'
        )
      ).toMatchSnapshot()
    })

    it('Should format regular user logs that has metadata', () => {
      // This is the result of a Redwood app calling
      // logger.debug({ input }, 'updatePost input')
      expect(
        logFormatter(
          '{"level":20,"time":1652381509868,"pid":46484,"hostname":"Tobbes-MacBook-Pro.local","input":{"title":"A little more about me","body":"Raclette shoreditch before they sold out lyft."},"msg":"updatePost input"}'
        )
      ).toMatchSnapshot()
    })

    it('Should print only metadata, if only metadata is logged', () => {
      expect(
        logFormatter(
          '{"level":20,"time":1652387012644,"pid":49648,"hostname":"Tobbes-MacBook-Pro.local","input":{"title":"A little more about me","body":"Metadata only"}}'
        )
      ).toEqual(
        [
          `${chalk.gray('22:23:32')} 🐛` + ' ',
          chalk.white(
            [
              '\n🗒  Metadata',
              '{',
              '  "input": {',
              '    "title": "A little more about me",',
              '    "body": "Metadata only"',
              '  }',
              '}',
            ].join('\n')
          ),
          '\n',
        ].join('')
      )
    })

    it('Should print the full details of error objects', () => {
      expect(
        logFormatter(
          '{"level":50,"time":1652385852132,"pid":48711,"hostname":"Tobbes-MacBook-Pro.local","err":{"code":3,"message":"Error number three"},"msg":"We got an error"}'
        )
      ).toEqual(
        [
          `${chalk.gray('22:04:12')} 🚨 ${chalk.red('We got an error')}` + ' ',
          chalk.white(
            [
              '\n🗒  Metadata',
              '{',
              '  "err": {',
              '    "code": 3,',
              '    "message": "Error number three"',
              '  }',
              '}',
            ].join('\n')
          ),
          '\n',
        ].join('')
      )
    })

    it('Should not crash on malformed json', () => {
      expect(
        logFormatter(
          '{"level":50,"time":1652385852132,"msg":"missing ending quote and curly brace'
        )
      ).toEqual(
        '{"level":50,"time":1652385852132,"msg":"missing ending quote and curly brace\n'
      )
    })
  })
})
