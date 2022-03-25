import { MetaTags } from '@redwoodjs/web'

import Spoiler from 'src/components/Spoiler'
import DiscordIcon from 'src/components/Icons/DiscordIcon'
import GitHubIcon from 'src/components/Icons/GitHubIcon'
import TwitterIcon from 'src/components/Icons/TwitterIcon'
import ShowcaseJobsCell from 'src/components/Showcase/ShowcaseJobsCell'

const SnapletPage = () => {
  return (
    <>
      <MetaTags
        title="Snaplet Showcase"
        description="A case-study on Snaplet, the tool for working with safe, versioned, up-to-date, production-like data, at the snap of your fingers."
      />
      <h1 className="sr-only">Snaplet</h1>
      <main className="max-w-screen-xl mx-auto mb-16 px-8 space-y-14 lg:space-y-20">
        {/* Header - Intro, Banner, Socials */}
        <section className="flex flex-col space-y-10">
          {/* Intro */}
          <div className="space-y-6 text-center">
            <div className="bg-[#FADB28] flex items-center justify-center py-8 rounded-md">
              <img
                alt="Snaplet Logo"
                draggable={false}
                className="max-w-[200px] select-none"
                src="/images/snaplet_logo.svg"
              />
            </div>
            <p className="font-light leading-relaxed text-xl text-stone-700 tracking-wide max-w-2xl mx-auto">
              Snaplet copies your Postgres database, transforming personal
              information, so you can safely code against actual data.
            </p>
          </div>
          {/* Social Links */}
          <ul className="flex flex-row items-center justify-center space-x-10">
            <li>
              <a className="button-social" href="https://www.snaplet.dev/">
                <span aria-hidden="true" className="icon md-24">
                  language
                </span>
                <span className="hidden md:block">Homepage</span>
              </a>
            </li>
            <li>
              <a
                className="button-social discord"
                href="https://discord.com/invite/aTMDKj6QJs"
              >
                <DiscordIcon aria-hidden="true" className="w-5" />
                <span className="hidden md:block">Discord</span>
              </a>
            </li>
            <li>
              <a
                className="button-social github"
                href="https://github.com/snaplet"
              >
                <GitHubIcon aria-hidden="true" className="w-5" />
                <span className="hidden md:block">GitHub</span>
              </a>
            </li>
            <li>
              <a
                className="button-social twitter"
                href="https://mobile.twitter.com/_snaplet"
              >
                <TwitterIcon aria-hidden="true" className="w-5" />
                <span className="hidden md:block">Twitter</span>
              </a>
            </li>
          </ul>
        </section>
        <div className="max-w-4xl mx-auto space-y-14 lg:space-y-20">
          {/* Tour */}
          <section className="flex flex-col space-y-8">
            <h2 className="border-b-2 border-orange-400 pb-3 font-bold text-4xl">
              Guided Tour
            </h2>
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec
              ante eros, iaculis ut ante et, tempor vehicula erat. Nam cursus
              eget augue non pellentesque. Nunc elementum nisl vel arcu luctus,
              sed vulputate lacus auctor. Maecenas euismod ultrices purus, nec
              faucibus eros venenatis vel. Donec eget pulvinar sem. Vestibulum
              efficitur nisi sit amet mauris tempus, eget hendrerit massa
              tincidunt.
            </p>
            <div className="self-center flex flex-col space-y-3 lg:max-w-lg w-full">
              <iframe
                className="aspect-video w-full"
                src="https://www.youtube.com/embed/tiF9SdM1i7M"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <p className="text-xs text-stone-500">
                A video from the founder(s) of Snaplet, walking you through
                their creation.
              </p>
            </div>
          </section>
          {/* Positions */}
          <section className="flex flex-col space-y-8">
            <h2 className="border-b-2 border-orange-400 pb-3 font-bold text-4xl">
              Open Positions
            </h2>
            <ShowcaseJobsCell company="Snaplet" />
          </section>
          {/* Bottom - QnA */}
          <section className="flex flex-col space-y-8">
            <h2 className="border-b-2 border-orange-400 pb-3 font-bold text-4xl">
              Q<span className="text-3xl">&</span>A
            </h2>
            <div className="flex flex-col space-y-10">
              <section className="flex flex-col space-y-6">
                <div className="space-y-1">
                  <h3 className="font-semibold text-2xl">Introduction</h3>
                  <p className="text-sm text-stone-500">
                    Get to know the person answering these questions, and their
                    project.
                  </p>
                </div>
                <Spoiler title="Who are you and what's your background?">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  pellentesque hendrerit lectus at sollicitudin. Duis tortor
                  justo, faucibus nec facilisis ac, tincidunt tristique libero.
                  Orci varius natoque penatibus et magnis dis parturient montes,
                  nascetur ridiculus mus. Sed id pellentesque lectus, id dapibus
                  dui.
                </Spoiler>
                <Spoiler title="What problem are you addressing?">
                  Maecenas dui tellus, finibus vel arcu vitae, accumsan pharetra
                  sem. Praesent vel nibh a lectus fermentum bibendum. Mauris
                  quis leo ac nulla pellentesque suscipit.
                </Spoiler>
                <Spoiler title="What solution are you bringing?">
                  Cras sagittis pharetra eleifend. Orci varius natoque penatibus
                  et magnis dis parturient montes, nascetur ridiculus mus. Nulla
                  aliquet ultricies mi non interdum. Duis at mi odio. Praesent
                  vel mi sit amet erat malesuada efficitur ut vestibulum nunc.
                  Nulla est urna, mollis ac ultrices nec, lacinia ut ipsum.
                  Vivamus aliquam velit sed nibh semper cursus.
                </Spoiler>
              </section>
              <section className="flex flex-col space-y-6">
                <div className="space-y-1">
                  <h3 className="font-semibold text-2xl">Redwood</h3>
                  <p className="text-sm text-stone-500">
                    How has RedwoodJS impacted this project, how is it being
                    used, what are the creator&apos;s thoughts on it?
                  </p>
                </div>
                <Spoiler title="Ultimately you had to choose Redwood over something else: what was the ultimate contender and how did you make your choice?">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  pellentesque hendrerit lectus at sollicitudin. Duis tortor
                  justo, faucibus nec facilisis ac, tincidunt tristique libero.
                  Orci varius natoque penatibus et magnis dis parturient montes,
                  nascetur ridiculus mus. Sed id pellentesque lectus, id dapibus
                  dui.
                </Spoiler>
                <Spoiler title="Are you using a vanilla setup or custom? Feel free to elaborate">
                  Maecenas dui tellus, finibus vel arcu vitae, accumsan pharetra
                  sem. Praesent vel nibh a lectus fermentum bibendum. Mauris
                  quis leo ac nulla pellentesque suscipit.
                </Spoiler>
                <Spoiler title="Which tool or feature from vanilla Redwood proves to be the most helpful?">
                  Maecenas dui tellus, finibus vel arcu vitae, accumsan pharetra
                  sem. Praesent vel nibh a lectus fermentum bibendum. Mauris
                  quis leo ac nulla pellentesque suscipit.
                </Spoiler>
                <Spoiler title="What gets you thrilled about its future?">
                  Maecenas dui tellus, finibus vel arcu vitae, accumsan pharetra
                  sem. Praesent vel nibh a lectus fermentum bibendum. Mauris
                  quis leo ac nulla pellentesque suscipit.
                </Spoiler>
              </section>
              <section className="flex flex-col space-y-6">
                <div className="space-y-1">
                  <h3 className="font-semibold text-2xl">Team</h3>
                  <p className="text-sm text-stone-500">
                    Is this project being worked on by a team? If so, how does
                    Redwood play a role in that teams collaboration?
                  </p>
                </div>
                <Spoiler title="Do you have a team?">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  pellentesque hendrerit lectus at sollicitudin. Duis tortor
                  justo, faucibus nec facilisis ac, tincidunt tristique libero.
                  Orci varius natoque penatibus et magnis dis parturient montes,
                  nascetur ridiculus mus. Sed id pellentesque lectus, id dapibus
                  dui.
                </Spoiler>
                <Spoiler title="Are you recruiting?">
                  Maecenas dui tellus, finibus vel arcu vitae, accumsan pharetra
                  sem. Praesent vel nibh a lectus fermentum bibendum. Mauris
                  quis leo ac nulla pellentesque suscipit.
                </Spoiler>
                <Spoiler title="How about onboarding with Redwood?">
                  Maecenas dui tellus, finibus vel arcu vitae, accumsan pharetra
                  sem. Praesent vel nibh a lectus fermentum bibendum. Mauris
                  quis leo ac nulla pellentesque suscipit.
                </Spoiler>
              </section>
              <section className="flex flex-col space-y-6">
                <div className="space-y-1">
                  <h3 className="font-semibold text-2xl">Community</h3>
                  <p className="text-sm text-stone-500">
                    RedwoodJS <i>is</i> its community — so how has this
                    community played a role in the author&apos;s project? Has it
                    contributed to its success?
                  </p>
                </div>
                <Spoiler title="Are you or one of your team collaborating to Redwood in any way?">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla
                  pellentesque hendrerit lectus at sollicitudin. Duis tortor
                  justo, faucibus nec facilisis ac, tincidunt tristique libero.
                  Orci varius natoque penatibus et magnis dis parturient montes,
                  nascetur ridiculus mus. Sed id pellentesque lectus, id dapibus
                  dui.
                </Spoiler>
                <Spoiler title="How do you meet the community?">
                  Maecenas dui tellus, finibus vel arcu vitae, accumsan pharetra
                  sem. Praesent vel nibh a lectus fermentum bibendum. Mauris
                  quis leo ac nulla pellentesque suscipit.
                </Spoiler>
              </section>
            </div>
          </section>
        </div>
        {/* QnA */}
        {/* About, Positions */}
        {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20">
          <section className="flex flex-col space-y-8">
            <h2 className="border-b-2 border-orange-400 pb-3 font-bold text-4xl">
              Guided Tour
            </h2>
            <p>
              In nec auctor ex, in suscipit sapien. Suspendisse in mi a massa
              malesuada euismod. Aenean sed sodales urna.
            </p>
            <div className="flex flex-col space-y-3 lg:max-w-lg w-full">
              <iframe
                className="aspect-video w-full"
                src="https://www.youtube.com/embed/tiF9SdM1i7M"
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
              <p className="text-xs text-stone-500">
                A video from the founder(s) of Snaplet, walking you through
                their creation.
              </p>
            </div>
          </section>
          <section className="flex flex-col space-y-8">
            <h2 className="border-b-2 border-orange-400 pb-3 font-bold text-4xl">
              Open Positions
            </h2>
            <ShowcaseJobsCell company="Snaplet" />
          </section>
        </div> */}
      </main>
    </>
  )
}

export default SnapletPage
