import { UI } from '../../constants/index';
import mkdown from '../../helpers/markdown';
import config from '../../../config.json';
import * as storiesController from '../../controllers/stories-controller';
import * as voltesController from '../../controllers/votes-controller';

const commonStoriesRoute = async(req, res, next, stories, title, currentElement) => {
  const currentPage = req.query.page;
  const skip = (currentPage - 1) * config.defaultValues.take;
  const data = !stories.error && stories.result.success ? stories.result.data.stories : null;
  const totalCount = !stories.error && stories.result.success ? stories.result.data.stories_count : 0;
  const hasNext = data ? totalCount > skip + data.length : false;
  const canDownvote = req.user ? req.user.karma >= config.defaultValues.minKarmaForDownvote : false;
  const userVoteMapping = req.user ? await voltesController.getUserStoriesVoteMapping(req.user._id, data) : [];

  res.render('index', {
    title: title,
    user: req.user,
    stories: data,
    total_count: totalCount,
    has_next: hasNext,
    current_page: currentPage,
    next_page: currentPage + 1,
    page_size: config.defaultValues.take,
    current_element: currentElement,
    can_downvote: canDownvote,
    user_vote_mapping: userVoteMapping,
  });
};

const commonSingleRoute = async(req, res, next, comm, title, template) => {
  const cres = await storiesController.getOneById(req.params.storyId);
  const story = !cres.error && cres.result.success ? cres.result.data : null;
  const comments = !comm.error && comm.result.success ? comm.result.data : [];
  const userVoteMapping = req.user ? await voltesController.getUserStoriesVoteMapping(req.user._id, [story]) : [];
  const commentsVoteMapping = req.user ? await voltesController.getUserCommentsVoteMapping(req.user._id, comments) : [];
  const canDownvote = req.user ? req.user.karma >= config.defaultValues.minKarmaForDownvote : false;

  res.render(template || 'single', {
    title: title || story.title,
    story: story,
    comments: comments,
    user: req.user,
    user_vote_mapping: userVoteMapping,
    comments_vote_mapping: commentsVoteMapping,
    can_downvote: canDownvote,
    markdown: mkdown,
    errors: req.flash('error'),
  });
};

const commonComments = async(req, res, next, comments, title, currentElement) => {
  const currentPage = req.query.page;
  const skip = (currentPage - 1) * config.defaultValues.take;
  const data = !comments.error && comments.result.success ? comments.result.data.comments : null;
  const totalCount = !comments.error && comments.result.success ? comments.result.data.comments_count : 0;
  const hasNext = data ? totalCount > skip + data.length : false;
  const canDownvote = req.user ? req.user.karma >= config.defaultValues.minKarmaForDownvote : false;
  const commentsVoteMapping = req.user ? await voltesController.getUserCommentsVoteMapping(req.user._id, data) : [];

  res.render('comments', {
    title: title || UI.Titles.Comments,
    user: req.user,
    comments: data,
    total_count: totalCount,
    has_next: hasNext,
    current_page: currentPage,
    next_page: currentPage + 1,
    current_element: currentElement || 'comments',
    can_downvote: canDownvote,
    comments_vote_mapping: commentsVoteMapping,
    markdown: mkdown,
  });
};

export {
  commonStoriesRoute,
  commonSingleRoute,
  commonComments,
};
